import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { WorkoutRoutine, Exercise, WorkoutSet } from '../types';
import { X, Plus, Trash2, Star, Calendar, Minus, Check } from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import { saveRoutine } from '../services/storage';
import ExerciseSearchModal from './ExerciseSearchModal';
import { customAlert } from '../utils/alert';

interface Props {
    visible: boolean;
    onClose: () => void;
    onLogSaved: (log: WorkoutRoutine) => void;
    initialRoutine?: WorkoutRoutine | null;
}

const SENSATIONS = [
    { label: 'Great', color: '#F8FAFC' },
    { label: 'Good', color: '#3B82F6' }, // Selected by default in image
    { label: 'Neutral', color: '#F8FAFC' },
    { label: 'Hard', color: '#F8FAFC' },
    { label: 'Exhausted', color: '#F8FAFC' },
];

export default function LogWorkoutModal({ visible, onClose, onLogSaved, initialRoutine }: Props) {
    const { colors } = useTheme();

    const [name, setName] = useState('Quick Workout');
    const [duration, setDuration] = useState(1);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [saveAsRoutine, setSaveAsRoutine] = useState(false);
    const [sensation, setSensation] = useState('Good');
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const formattedDate = useMemo(() => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }, [date]);

    React.useEffect(() => {
        if (visible) {
            if (initialRoutine) {
                setName(initialRoutine.name);
                setDuration(Math.round(initialRoutine.duration / 60));
                setExercises(JSON.parse(JSON.stringify(initialRoutine.exercises))); // Deep clone
                setSaveAsRoutine(false);
                setDate(new Date(initialRoutine.date || new Date()));
            } else {
                resetForm();
            }
        }
    }, [visible, initialRoutine]);

    const progress = useMemo(() => {
        if (exercises.length === 0) return 0;
        const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        if (totalSets === 0) return 0;
        const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.status === 'completed' || s.status === 'partial').length, 0);
        return Math.round((completedSets / totalSets) * 100);
    }, [exercises]);

    const handleAddExercise = (exerciseName: string, sets: number, reps: number) => {
        const newExercise: Exercise = {
            id: Crypto.randomUUID(),
            name: exerciseName,
            muscleGroup: 'General',
            sets: Array.from({ length: sets }).map(() => ({
                id: Crypto.randomUUID(),
                reps: reps,
                weight: 0,
                status: 'completed'
            }))
        };
        setExercises([...exercises, newExercise]);
    };

    const handleRemoveExercise = (exId: string) => {
        setExercises(exercises.filter(e => e.id !== exId));
    };

    const handleAddSet = (exIdx: number) => {
        const updated = [...exercises];
        updated[exIdx].sets.push({
            id: Crypto.randomUUID(),
            reps: 0,
            weight: 0,
            status: 'completed'
        });
        setExercises(updated);
    };

    const handleUpdateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight' | 'status', value: any) => {
        const updated = [...exercises];
        if (field === 'status') {
            updated[exIdx].sets[setIdx].status = value;
        } else {
            const val = parseFloat(value) || 0;
            // @ts-ignore
            updated[exIdx].sets[setIdx][field] = val;
        }
        setExercises(updated);
    };

    const handleRemoveSet = (exIdx: number, setIdx: number) => {
        const updated = [...exercises];
        updated[exIdx].sets.splice(setIdx, 1);
        setExercises(updated);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            customAlert('Missing Name', 'Please give your workout a name.');
            return;
        }

        const newLog: WorkoutRoutine = {
            id: Crypto.randomUUID(),
            name: name.trim(),
            exercises: exercises,
            date: date.toISOString(),
            duration: duration * 60, // Convert minutes to seconds
            status: 'completed',
            tags: ['Quick Workout']
        };

        if (saveAsRoutine) {
            await saveRoutine({
                ...newLog,
                id: Crypto.randomUUID(),
                status: 'planned',
                date: new Date().toISOString()
            });
        }

        onLogSaved(newLog);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName('Quick Workout');
        setDuration(1);
        setExercises([]);
        setSaveAsRoutine(false);
        setSensation('Good');
        setDate(new Date());
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: colors.background }}>

                    {/* Header */}
                    <View style={{ padding: 20, paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={{ color: colors.text, fontSize: 28, fontWeight: 'bold' }}>Quick Workout</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>One-off session</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                            <X color={colors.textSecondary} size={28} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                        {/* Progress */}
                        <View style={{ marginBottom: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Progress</Text>
                                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold' }}>{progress}%</Text>
                            </View>
                            <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 }}>
                                <View style={{ width: `${progress}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
                            </View>
                        </View>

                        {/* Exercise List */}
                        {exercises.map((ex, exIdx) => (
                            <View key={ex.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{ex.name}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveExercise(ex.id)}>
                                        <Trash2 color="#EF4444" size={20} />
                                    </TouchableOpacity>
                                </View>

                                {ex.sets.map((set, setIdx) => (
                                    <View key={set.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', gap: 6, marginRight: 12 }}>
                                            {/* Success Button */}
                                            <TouchableOpacity
                                                onPress={() => handleUpdateSet(exIdx, setIdx, 'status', 'completed')}
                                                style={{
                                                    width: 32, height: 32,
                                                    borderRadius: 16,
                                                    backgroundColor: set.status === 'completed' ? '#22C55E' : 'transparent',
                                                    borderWidth: 1,
                                                    borderColor: set.status === 'completed' ? '#22C55E' : '#E2E8F0',
                                                    alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Check color={set.status === 'completed' ? '#FFF' : '#94A3B8'} size={16} />
                                            </TouchableOpacity>

                                            {/* Partial Button */}
                                            <TouchableOpacity
                                                onPress={() => handleUpdateSet(exIdx, setIdx, 'status', 'partial')}
                                                style={{
                                                    width: 32, height: 32,
                                                    borderRadius: 16,
                                                    backgroundColor: set.status === 'partial' ? '#F59E0B' : 'transparent',
                                                    borderWidth: 1,
                                                    borderColor: set.status === 'partial' ? '#F59E0B' : '#E2E8F0',
                                                    alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <View style={{ transform: [{ rotate: '45deg' }] }}>
                                                    <Minus color={set.status === 'partial' ? '#FFF' : '#94A3B8'} size={16} />
                                                </View>
                                            </TouchableOpacity>

                                            {/* Failed Button */}
                                            <TouchableOpacity
                                                onPress={() => handleUpdateSet(exIdx, setIdx, 'status', 'failed')}
                                                style={{
                                                    width: 32, height: 32,
                                                    borderRadius: 16,
                                                    backgroundColor: set.status === 'failed' ? '#EF4444' : 'transparent',
                                                    borderWidth: 1,
                                                    borderColor: set.status === 'failed' ? '#EF4444' : '#E2E8F0',
                                                    alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <X color={set.status === 'failed' ? '#FFF' : '#94A3B8'} size={16} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                            <TextInput
                                                style={{ flex: 1, backgroundColor: colors.background, color: colors.text, padding: 8, borderRadius: 8, textAlign: 'center', marginRight: 8 }}
                                                keyboardType="numeric"
                                                defaultValue={set.weight > 0 ? set.weight.toString() : ''}
                                                onChangeText={val => handleUpdateSet(exIdx, setIdx, 'weight', val)}
                                                placeholder="KG"
                                            />
                                            <TextInput
                                                style={{ flex: 1, backgroundColor: colors.background, color: colors.text, padding: 8, borderRadius: 8, textAlign: 'center', marginRight: 8 }}
                                                keyboardType="numeric"
                                                defaultValue={set.reps > 0 ? set.reps.toString() : ''}
                                                onChangeText={val => handleUpdateSet(exIdx, setIdx, 'reps', val)}
                                                placeholder="REPS"
                                            />
                                        </View>

                                        <TouchableOpacity onPress={() => handleRemoveSet(exIdx, setIdx)} style={{ padding: 4 }}>
                                            <Trash2 color="#94A3B8" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    onPress={() => handleAddSet(exIdx)}
                                    style={{ marginTop: 8, padding: 8, alignItems: 'center' }}
                                >
                                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ Add Set</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Add Exercise Button */}
                        <TouchableOpacity
                            onPress={() => setSearchModalVisible(true)}
                            style={{
                                height: 60, borderRadius: 12, borderStyle: 'dotted', borderWidth: 1, borderColor: '#CBD5E1',
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24
                            }}
                        >
                            <Plus size={24} color="#94A3B8" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#94A3B8', fontSize: 18, fontWeight: '600' }}>Add Exercise</Text>
                        </TouchableOpacity>

                        {/* Session Details Card */}
                        <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 }}>Session Details</Text>

                            {/* Date Selector */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Calendar size={22} color={colors.primary} style={{ marginRight: 12 }} />
                                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#334155' }}>{formattedDate}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                                >
                                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }}>CHANGE DATE</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Duration Selector */}
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>DURATION (MIN)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                <TouchableOpacity
                                    onPress={() => setDuration(Math.max(1, duration - 1))}
                                    style={{ width: 60, height: 60, backgroundColor: '#1E293B', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Minus size={24} color="#FFF" />
                                </TouchableOpacity>
                                <View style={{ flex: 1, height: 60, backgroundColor: '#0F172A', marginHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginRight: 8 }}>{duration}</Text>
                                    <Text style={{ color: '#475569', fontSize: 14 }}>min</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setDuration(duration + 1)}
                                    style={{ width: 60, height: 60, backgroundColor: '#1E293B', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Plus size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Sensation Selector */}
                            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>How did it feel?</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {SENSATIONS.map((s) => (
                                        <TouchableOpacity
                                            key={s.label}
                                            onPress={() => setSensation(s.label)}
                                            style={{
                                                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                                                backgroundColor: sensation === s.label ? colors.primary : '#F1F5F9',
                                                borderWidth: 1, borderColor: sensation === s.label ? colors.primary : 'transparent'
                                            }}
                                        >
                                            <Text style={{ color: sensation === s.label ? '#FFF' : '#64748B', fontWeight: '600' }}>{s.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Save as Routine Toggle */}
                        <TouchableOpacity
                            onPress={() => setSaveAsRoutine(!saveAsRoutine)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: saveAsRoutine ? colors.primary + '10' : colors.card,
                                borderWidth: 1,
                                borderColor: saveAsRoutine ? colors.primary : '#E2E8F0',
                                marginBottom: 20
                            }}
                        >
                            <Star size={20} color={saveAsRoutine ? colors.primary : colors.textSecondary} fill={saveAsRoutine ? colors.primary : 'transparent'} />
                            <Text style={{ marginLeft: 10, color: saveAsRoutine ? colors.primary : colors.text, fontWeight: '600' }}>Save as Routine</Text>
                        </TouchableOpacity>

                    </ScrollView>

                    {/* Bottom Complete Button */}
                    <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
                        <TouchableOpacity
                            onPress={handleSave}
                            style={{
                                backgroundColor: colors.primary,
                                paddingVertical: 18,
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
                            }}
                        >
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Complete Workout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ExerciseSearchModal
                    visible={searchModalVisible}
                    onClose={() => setSearchModalVisible(false)}
                    onSelect={handleAddExercise}
                    addedExercises={exercises}
                    onRemove={handleRemoveExercise}
                />

                {/* Custom Date Picker Modal */}
                <Modal visible={showDatePicker} transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '85%', maxWidth: 400 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 20, textAlign: 'center' }}>Select Date</Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 }}>
                                {/* Day Selector */}
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, fontWeight: 'bold' }}>DAY</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newDate = new Date(date);
                                            newDate.setDate(date.getDate() + 1);
                                            if (newDate <= new Date()) setDate(newDate);
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 24, color: colors.primary }}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0F172A', marginVertical: 8 }}>{date.getDate()}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newDate = new Date(date);
                                            newDate.setDate(date.getDate() - 1);
                                            setDate(newDate);
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 24, color: colors.primary }}>▼</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Month Selector */}
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, fontWeight: 'bold' }}>MONTH</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newDate = new Date(date);
                                            newDate.setMonth(date.getMonth() + 1);
                                            if (newDate <= new Date()) setDate(newDate);
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 24, color: colors.primary }}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0F172A', marginVertical: 8 }}>{date.getMonth() + 1}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newDate = new Date(date);
                                            newDate.setMonth(date.getMonth() - 1);
                                            setDate(newDate);
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 24, color: colors.primary }}>▼</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Year Selector */}
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, fontWeight: 'bold' }}>YEAR</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newDate = new Date(date);
                                            newDate.setFullYear(date.getFullYear() + 1);
                                            if (newDate <= new Date()) setDate(newDate);
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 24, color: colors.primary }}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0F172A', marginVertical: 8 }}>{date.getFullYear()}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const newDate = new Date(date);
                                            newDate.setFullYear(date.getFullYear() - 1);
                                            setDate(newDate);
                                        }}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ fontSize: 24, color: colors.primary }}>▼</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                                style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </Modal>
    );
}

