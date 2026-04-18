import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { WorkoutRoutine } from '../types';
import { getRoutines, saveRoutine, saveWorkoutLog, deleteRoutine, getWorkoutLogs } from '../services/storage';
import WorkoutAIModal from '../components/WorkoutAIModal';
import ManualWorkoutModal from '../components/ManualWorkoutModal';
import LogWorkoutModal from '../components/LogWorkoutModal';
import WorkoutDetailModal from '../components/WorkoutDetailModal';
import FABMenu from '../components/FABMenu';
import { ActionSheetIOS, Platform, Alert, Image, Share } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Share2, Edit3, ChevronRight, Dumbbell, Star, CheckCircle2, Plus } from 'lucide-react-native';

const LOGO_IMG = require('../assets/logo.png');
import { useSquads } from '../context/SquadContext';

export default function RoutinesScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { squads } = useSquads();
    const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
    const [manualModalVisible, setManualModalVisible] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [fabMenuVisible, setFabMenuVisible] = useState(false);

    // Additional state
    const [detailWorkout, setDetailWorkout] = useState<WorkoutRoutine | null>(null); // Kept this as it's used later
    const [existingRoutineModalVisible, setExistingRoutineModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [filterFavorites, setFilterFavorites] = useState(false);
    const [todayLogIds, setTodayLogIds] = useState<string[]>([]);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [routineToShare, setRoutineToShare] = useState<WorkoutRoutine | null>(null);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();

    useFocusEffect(
        useCallback(() => {
            loadRoutines();
            loadTodayLogs();
        }, [])
    );

    useEffect(() => {
        loadRoutines();
        loadTodayLogs();
    }, []);

    useEffect(() => {
        if (route.params?.viewLog) {
            setDetailWorkout(route.params.viewLog);
            setDetailModalVisible(true);
            // Clear params to avoid re-opening on next focus if not intended, 
            // though navigation params persist. We could use setParams({ viewLog: undefined })
            navigation.setParams({ viewLog: undefined } as any);
        }
    }, [route.params?.viewLog]);

    const loadRoutines = async () => {
        const data = await getRoutines();
        setRoutines(data);
    };

    const loadTodayLogs = async () => {
        const logs = await getWorkoutLogs();
        const today = new Date().toDateString();
        // Assume log.id matches routine.id when started from a routine
        // We might need to store routineId in logs in a real app, 
        // but here we use log.id as it's copied from routine.id in ActiveWorkoutScreen
        const ids = logs
            .filter(log => new Date(log.date).toDateString() === today)
            .map(log => log.id);
        setTodayLogIds(ids);
    };

    const handleRoutineCreated = async (routine: WorkoutRoutine) => {
        await saveRoutine(routine);
        setManualModalVisible(false);
        setEditingRoutine(null);
        loadRoutines(); // Refresh
    };

    const handleRoutineDeleted = async (id: string) => {
        await deleteRoutine(id);
        setManualModalVisible(false);
        setEditingRoutine(null);
        loadRoutines(); // Refresh
    };

    const handleEdit = (routine: WorkoutRoutine) => {
        setEditingRoutine(routine);
        setManualModalVisible(true);
    };

    const startWorkout = (routine: WorkoutRoutine) => {
        navigation.navigate('ActiveWorkout', { routine });
    };

    const handleLogSaved = async (log: WorkoutRoutine) => {
        await saveWorkoutLog(log);
        setLogModalVisible(false);
        loadRoutines(); // Refresh list to show new routine if "Save as Routine" was checked
    };

    const toggleFavorite = (id: string) => {
        setRoutines(prev => prev.map(r =>
            r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
        ));
        // Note: Future improvement would save this to persistent storage
    };

    const handleShare = (routine: WorkoutRoutine) => {
        setRoutineToShare(routine);
        setShareModalVisible(true);
    };

    const handleNativeShare = async (routine: WorkoutRoutine) => {
        setShareModalVisible(false);
        try {
            await Share.share({
                message: `Check out my workout routine: ${routine.name}\n${routine.description || ''}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSquadShare = (squadId: string) => {
        if (routineToShare) {
            setShareModalVisible(false);
            navigation.navigate('SquadDetail', { squadId, shareRoutine: routineToShare });
        }
    };

    const handleCreatePress = () => {
        setFabMenuVisible(true);
    };

    const toggleFilter = () => {
        setFilterFavorites(!filterFavorites);
    };

    const displayedRoutines = filterFavorites
        ? routines.filter(r => r.isFavorite)
        : routines;

    const handleShowDetail = (routine: WorkoutRoutine) => {
        setDetailWorkout(routine);
        setDetailModalVisible(true);
    };

    const handleDoAgain = (workout: WorkoutRoutine) => {
        const routineToStart = {
            ...workout,
            status: 'planned' as const,
            exercises: workout.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(s => ({ ...s, status: 'pending' as const }))
            }))
        };
        setDetailModalVisible(false);
        navigation.navigate('ActiveWorkout', { routine: routineToStart });
    };

    const renderRoutine = ({ item }: { item: WorkoutRoutine }) => {
        const isCompletedToday = todayLogIds.includes(item.id);

        return (
            <View style={{
                backgroundColor: isCompletedToday ? '#F0FDF4' : '#FFF',
                padding: 16,
                borderRadius: 20,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: isCompletedToday ? '#BBF7D0' : '#a6afb9ff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
                elevation: 2
            }}>
                <TouchableOpacity onPress={() => handleShowDetail(item)}>
                    {/* Title and Action Icons */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Text style={{ color: isCompletedToday ? '#166534' : '#0F172A', fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
                                {isCompletedToday && (
                                    <View style={{
                                        backgroundColor: '#22C55E',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                        marginLeft: 6,
                                        marginVertical: 2,
                                        shadowColor: '#22C55E',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 4,
                                        elevation: 4
                                    }}>
                                        <CheckCircle2 color="#FFF" size={10} style={{ marginRight: 2 }} />
                                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('completedToday')}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                <Star color={item.isFavorite ? '#F59E0B' : '#CBD5E1'} fill={item.isFavorite ? '#F59E0B' : 'transparent'} size={18} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginLeft: 10 }}>
                                <Edit3 color="#94A3B8" size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                            {item.tags.map((tag, idx) => (
                                <View key={idx} style={{ backgroundColor: isCompletedToday ? '#DCFCE7' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 }}>
                                    <Text style={{ color: isCompletedToday ? '#16A34A' : '#64748B', fontSize: 11, fontWeight: '600' }}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    {item.description && (
                        <Text style={{ color: isCompletedToday ? '#166534' : '#64748B', fontSize: 13, marginBottom: 12, lineHeight: 18 }}>{item.description}</Text>
                    )}

                    {/* Exercise Mini-Summary */}
                    <View style={{
                        backgroundColor: isCompletedToday ? '#DCFCE7' : '#F8FAFC',
                        borderRadius: 10,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: isCompletedToday ? '#BBF7D0' : '#E2E8F0',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16
                    }}>
                        <Dumbbell size={16} color={isCompletedToday ? '#16A34A' : "#94A3B8"} style={{ marginRight: 8 }} />
                        <Text style={{ color: isCompletedToday ? '#16A34A' : '#64748B', fontSize: 13, fontWeight: '600', flex: 1 }}>
                            {item.exercises.length} {t('exercises').toLowerCase()} <Text style={{ color: isCompletedToday ? '#86EFAC' : '#CBD5E1', marginHorizontal: 4 }}>|</Text> <Text style={{ fontWeight: '400', fontSize: 12, color: isCompletedToday ? '#166534' : '#94A3B8' }}>{item.exercises.slice(0, 3).map(e => e.name).join(', ')}{item.exercises.length > 3 ? '...' : ''}</Text>
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Bottom Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => handleShare(item)}
                        style={{ backgroundColor: '#F1F5F9', padding: 10, borderRadius: 12, marginRight: 10 }}
                    >
                        <Share2 color="#64748B" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ backgroundColor: isCompletedToday ? '#22C55E' : '#0F172A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
                        onPress={() => startWorkout(item)}
                    >
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', marginRight: 6 }}>{isCompletedToday ? t('doAgain') : t('start')}</Text>
                        <ChevronRight color="#FFF" size={16} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={LOGO_IMG}
                        style={{ width: 48, height: 48, marginRight: 12 }}
                        resizeMode="contain"
                    />
                    <Text style={{ color: '#0F172A', fontSize: 28, fontWeight: 'bold' }}>{t('myRoutines')}</Text>
                </View>
                <TouchableOpacity
                    onPress={toggleFilter}
                    style={{
                        backgroundColor: filterFavorites ? '#FEF3C7' : '#F1F5F9',
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: filterFavorites ? 1 : 0,
                        borderColor: '#F59E0B'
                    }}
                >
                    <Star color={filterFavorites ? '#F59E0B' : '#94A3B8'} fill={filterFavorites ? '#F59E0B' : 'transparent'} size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={displayedRoutines}
                renderItem={renderRoutine}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: colors.textSecondary }}>
                            {filterFavorites ? t('noFavRoutines') : t('noRoutinesYet')}
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={handleCreatePress}
                style={{
                    position: 'absolute',
                    bottom: 30,
                    right: 20,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                }}
            >
                <Plus color="#FFF" size={30} strokeWidth={2.5} />
            </TouchableOpacity>

            <ManualWorkoutModal
                visible={manualModalVisible}
                onClose={() => {
                    setManualModalVisible(false);
                    setEditingRoutine(null);
                }}
                onRoutineCreated={handleRoutineCreated}
                onRoutineDeleted={handleRoutineDeleted}
                initialRoutine={editingRoutine}
            />

            <LogWorkoutModal
                visible={logModalVisible}
                onClose={() => setLogModalVisible(false)}
                onLogSaved={handleLogSaved}
            />

            <WorkoutDetailModal
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                workout={detailWorkout}
                onEdit={handleEdit}
                onDoAgain={handleDoAgain}
            />

            <FABMenu
                visible={fabMenuVisible}
                onClose={() => setFabMenuVisible(false)}
                onAdd={() => setLogModalVisible(true)}
                onBuild={() => {
                    setEditingRoutine(null);
                    setManualModalVisible(true);
                }}
            />

            {/* Share Selection Modal */}
            <Modal
                visible={shareModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShareModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: colors.card, width: '100%', maxWidth: 320, borderRadius: 24, padding: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{t('shareRoutine')}</Text>
                            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                <CheckCircle2 size={0} />
                                {/* Dummy or X icon */}
                                <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => routineToShare && handleNativeShare(routineToShare)}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.background, borderRadius: 16, marginBottom: 24 }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <Share2 size={20} color={colors.text} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{t('shareExternally')}</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('viaOtherApps')}</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase' }}>{t('sendToSquad')}</Text>

                        <ScrollView style={{ maxHeight: 200 }}>
                            {squads.map(squad => (
                                <TouchableOpacity
                                    key={squad.id}
                                    onPress={() => handleSquadShare(squad.id)}
                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.background }}
                                >
                                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: squad.color || '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <Text style={{ fontSize: 16 }}>{squad.icon || '👥'}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{squad.name}</Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{squad.members} members</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {squads.length === 0 && (
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>{t('noSquadsYet')}</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
