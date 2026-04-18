import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { WorkoutRoutine, WorkoutSet } from '../types';
import { Play, Pause, Square, Check, X, ChevronLeft, Minus, Timer, Plus } from 'lucide-react-native';
import { saveWorkoutLog } from '../services/storage';
import { customAlert } from '../utils/alert';
import FinishWorkoutModal from '../components/FinishWorkoutModal';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import * as Crypto from 'expo-crypto';
import { Exercise } from '../types';

import { useLanguage } from '../context/LanguageContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

interface Props {
    routine?: WorkoutRoutine;
    onFinish?: () => void;
    onBack?: () => void;
}

export default function ActiveWorkoutScreen({ routine: propRoutine, onFinish: propOnFinish, onBack }: Props) {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const route = useRoute<RouteProp<RootStackParamList, 'ActiveWorkout'>>();
    // Priority: Prop -> Route Param -> Error/Fallback
    const routine = propRoutine || route.params?.routine;
    const navigation = useNavigation();

    const onFinish = propOnFinish || (() => navigation.goBack());

    if (!routine) return null; // Or some error state

    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // --- Countdown State ---
    const [showCountdown, setShowCountdown] = useState(true);
    const [countdownValue, setCountdownValue] = useState(3);
    const countdownScale = useRef(new Animated.Value(0.3)).current;
    const countdownOpacity = useRef(new Animated.Value(0)).current;
    const overlayOpacity = useRef(new Animated.Value(1)).current;

    const animateCountdownTick = useCallback(() => {
        countdownScale.setValue(0.3);
        countdownOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(countdownScale, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
            }),
            Animated.timing(countdownOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [countdownScale, countdownOpacity]);

    useEffect(() => {
        if (!showCountdown) return;
        animateCountdownTick();

        if (countdownValue > 0) {
            const timer = setTimeout(() => {
                setCountdownValue(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // countdownValue === 0 means we're showing "Listo!"
            const timer = setTimeout(() => {
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }).start(() => {
                    setShowCountdown(false);
                    setIsRunning(true);
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [countdownValue, showCountdown]);
    const [activeRoutine, setActiveRoutine] = useState(routine);
    const [finishModalVisible, setFinishModalVisible] = useState(false);
    const [finalWorkoutData, setFinalWorkoutData] = useState<WorkoutRoutine | null>(null);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    // Track set completion locally
    // We need deep copy or state management for sets. 
    // For simplicity, we assume activeRoutine is the state.
    const progress = useMemo(() => {
        let total = 0;
        let attempted = 0;
        activeRoutine.exercises.forEach(ex => {
            total += ex.sets.length;
            attempted += ex.sets.filter((s: any) =>
                s.status === 'completed' || s.status === 'partial' || s.status === 'failed'
            ).length;
        });
        return total === 0 ? 0 : (attempted / total) * 100;
    }, [activeRoutine]);

    const animatedProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsed((e: number) => e + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const updateSetStatus = (exerciseIndex: number, setIndex: number, status: any) => {
        const updated = {
            ...activeRoutine,
            exercises: activeRoutine.exercises.map((ex, exIdx) => {
                if (exIdx !== exerciseIndex) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, sIdx) => {
                        if (sIdx !== setIndex) return s;
                        return {
                            ...s,
                            status: s.status === status ? 'pending' : status
                        };
                    })
                };
            })
        };

        setActiveRoutine(updated);
    };

    const handleAddExercise = (exerciseName: string, sets: number, reps: number) => {
        const newExercise: Exercise = {
            id: Crypto.randomUUID(),
            name: exerciseName,
            muscleGroup: 'General',
            sets: Array.from({ length: sets }).map(() => ({
                id: Crypto.randomUUID(),
                reps: reps,
                weight: 0,
                status: 'pending'
            }))
        };
        setActiveRoutine(prev => ({
            ...prev,
            exercises: [...prev.exercises, newExercise]
        }));
    };

    const handleRemoveExercise = (exId: string) => {
        setActiveRoutine(prev => ({
            ...prev,
            exercises: prev.exercises.filter(e => e.id !== exId)
        }));
    };

    const handleFinish = () => {
        const hasPending = activeRoutine.exercises.some(ex =>
            ex.sets.some(s => s.status === 'pending')
        );

        if (hasPending) {
            customAlert(
                t('incompleteWorkout'),
                t('incompleteWorkoutMsg'),
                [
                    { text: t('cancel'), style: "cancel" },
                    {
                        text: t('finishAnyways'),
                        style: "destructive",
                        onPress: () => {
                            const finalWorkout = {
                                ...activeRoutine,
                                exercises: activeRoutine.exercises.map(ex => ({
                                    ...ex,
                                    sets: ex.sets.map(s => ({
                                        ...s,
                                        status: s.status === 'pending' ? 'failed' : s.status
                                    }))
                                }))
                            };
                            setFinalWorkoutData(finalWorkout);
                            setFinishModalVisible(true);
                        }
                    }
                ]
            );
        } else {
            setFinalWorkoutData(activeRoutine);
            setFinishModalVisible(true);
        }
    };

    const handleSaveWorkout = async (sensation: 'Great' | 'Good' | 'Neutral' | 'Hard' | 'Exhausted', notes: string, imageUri?: string) => {
        if (!finalWorkoutData) return;

        const workoutToSave = {
            ...finalWorkoutData,
            sensation,
            notes,
            imageUri
        };

        setFinishModalVisible(false);
        await finishWorkout(workoutToSave);
    };

    const finishWorkout = async (workoutLog: WorkoutRoutine) => {
        setIsRunning(false);
        const finalWorkout = { ...workoutLog };
        finalWorkout.duration = elapsed;
        finalWorkout.status = 'completed';
        finalWorkout.date = new Date().toISOString();
        await saveWorkoutLog(finalWorkout);
        customAlert(t('workoutFinished'), t('greatJob'), [{ text: t('done'), onPress: onFinish }]);
    };

    const handleCancel = () => {
        Alert.alert(
            t('cancelWorkout'),
            t('cancelWorkoutMsg'),
            [
                { text: t('cancel'), style: "cancel" },
                { text: t('yesCancel'), style: "destructive", onPress: () => navigation.goBack() }
            ]
        );
    };

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* === Countdown Overlay === */}
            {showCountdown && (
                <Animated.View
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        zIndex: 999,
                        backgroundColor: '#0F172A',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: overlayOpacity,
                    }}
                >
                    {/* Pulse rings */}
                    <View style={{
                        width: 200,
                        height: 200,
                        borderRadius: 100,
                        borderWidth: 3,
                        borderColor: colors.primary + '15',
                        position: 'absolute',
                    }} />
                    <View style={{
                        width: 280,
                        height: 280,
                        borderRadius: 140,
                        borderWidth: 2,
                        borderColor: colors.primary + '08',
                        position: 'absolute',
                    }} />

                    {/* Main countdown circle */}
                    <Animated.View
                        style={{
                            width: 160,
                            height: 160,
                            borderRadius: 80,
                            backgroundColor: colors.primary + '20',
                            borderWidth: 4,
                            borderColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: [{ scale: countdownScale }],
                            opacity: countdownOpacity,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 30,
                            elevation: 20,
                        }}
                    >
                        <Text
                            style={{
                                color: '#FFFFFF',
                                fontSize: countdownValue > 0 ? 72 : 36,
                                fontWeight: '900',
                                letterSpacing: countdownValue > 0 ? 0 : 2,
                                textTransform: 'uppercase',
                            }}
                        >
                            {countdownValue > 0 ? countdownValue : t('getReady')}
                        </Text>
                    </Animated.View>

                    {/* Routine name below */}
                    <Text style={{
                        color: '#94A3B8',
                        fontSize: 16,
                        fontWeight: '600',
                        marginTop: 48,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                    }}>
                        {activeRoutine.name}
                    </Text>
                </Animated.View>
            )}
            {/* Header */}
            <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TouchableOpacity onPress={onBack || handleCancel} style={{ marginRight: 16 }}>
                        <ChevronLeft color={colors.text} size={28} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('activeSession')}</Text>
                        <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{activeRoutine.name}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleFinish}
                    style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                >
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t('finish')}</Text>
                </TouchableOpacity>
            </View>

            {/* Progress Bar Area */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 15, backgroundColor: colors.card }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '600' }}>{t('progress')}</Text>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>{Math.round(progress)}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <Animated.View
                        style={{
                            height: '100%',
                            width: animatedProgress.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: colors.primary,
                            borderRadius: 4
                        }}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {activeRoutine.exercises.map((exercise: any, exIdx: number) => (
                    <View key={exIdx} style={{ marginBottom: 24 }}>
                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{exercise.name}</Text>
                        {exercise.sets.map((set: any, setIdx: number) => (
                            <View
                                key={setIdx}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: colors.card,
                                    padding: 12,
                                    borderRadius: 16,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: '#F1F5F9'
                                }}
                            >
                                <View>
                                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>{t('set')} {setIdx + 1}</Text>
                                    <Text style={{ color: colors.text }}>{set.reps} {t('reps').toLowerCase()} x {set.weight}kg</Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {/* Success Button */}
                                    <TouchableOpacity
                                        onPress={() => updateSetStatus(exIdx, setIdx, 'completed')}
                                        style={{
                                            width: 36, height: 36,
                                            borderRadius: 18,
                                            backgroundColor: set.status === 'completed' ? '#22C55E' : 'transparent',
                                            borderWidth: 1,
                                            borderColor: set.status === 'completed' ? '#22C55E' : '#E2E8F0',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <Check color={set.status === 'completed' ? '#FFF' : '#94A3B8'} size={18} />
                                    </TouchableOpacity>

                                    {/* Partial Button */}
                                    <TouchableOpacity
                                        onPress={() => updateSetStatus(exIdx, setIdx, 'partial')}
                                        style={{
                                            width: 36, height: 36,
                                            borderRadius: 18,
                                            backgroundColor: set.status === 'partial' ? '#F59E0B' : 'transparent',
                                            borderWidth: 1,
                                            borderColor: set.status === 'partial' ? '#F59E0B' : '#E2E8F0',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <View style={{ transform: [{ rotate: '45deg' }] }}>
                                            <Minus color={set.status === 'partial' ? '#FFF' : '#94A3B8'} size={18} />
                                        </View>
                                    </TouchableOpacity>

                                    {/* Failed Button */}
                                    <TouchableOpacity
                                        onPress={() => updateSetStatus(exIdx, setIdx, 'failed')}
                                        style={{
                                            width: 36, height: 36,
                                            borderRadius: 18,
                                            backgroundColor: set.status === 'failed' ? '#EF4444' : 'transparent',
                                            borderWidth: 1,
                                            borderColor: set.status === 'failed' ? '#EF4444' : '#E2E8F0',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <X color={set.status === 'failed' ? '#FFF' : '#94A3B8'} size={18} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}

                <TouchableOpacity
                    onPress={() => setSearchModalVisible(true)}
                    style={{
                        height: 60, borderRadius: 16, borderStyle: 'dotted', borderWidth: 2, borderColor: '#CBD5E1',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                        backgroundColor: colors.card
                    }}
                >
                    <Plus size={24} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>{t('addExercise')}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Floating Timer Panel */}
            <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
                <View style={{
                    backgroundColor: colors.card,
                    borderRadius: 24,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 80,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#EFF6FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10
                        }}>
                            <Timer size={20} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('sessionTime').toUpperCase()}</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A', fontVariant: ['tabular-nums'] }}>
                                {formatTime(elapsed)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setIsRunning(!isRunning)}
                        style={{
                            backgroundColor: '#2563EB',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            minWidth: 110,
                            justifyContent: 'center'
                        }}
                    >
                        {isRunning ? (
                            <>
                                <Pause size={18} color="#FFF" fill="#FFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{t('pause')}</Text>
                            </>
                        ) : (
                            <>
                                <Play size={18} color="#FFF" fill="#FFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{t('resume')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <FinishWorkoutModal
                visible={finishModalVisible}
                onClose={() => setFinishModalVisible(false)}
                onSave={handleSaveWorkout}
            />

            <ExerciseSearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSelect={handleAddExercise}
                addedExercises={activeRoutine.exercises}
                onRemove={handleRemoveExercise}
            />
        </View>
    );
}
