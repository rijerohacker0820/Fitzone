import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert, Image, StyleSheet, Platform, ActionSheetIOS } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { WorkoutRoutine, Exercise, WorkoutSet } from '../types';
import { X, Plus, Trash2, Save, Sparkles, PenTool, Dumbbell } from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import { generateWorkout } from '../services/gemini';
import SetRepSelectionModal from './SetRepSelectionModal';
import { customAlert } from '../utils/alert';

const LOGO_IMG = require('../assets/logo.png');

const QUICK_EXERCISES = [
    'Squat', 'Bench Press', 'Deadlift',
    'Overhead Press', 'Pull Up', 'Dumbbell Row',
    'Lunge', 'Leg Press', 'Push Up', 'Plank',
    'Bicep Curl', 'Tricep Extension', 'Lat Pulldown',
    'Face Pull', 'Romanian Deadlift'
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onRoutineCreated: (routine: WorkoutRoutine) => void;
    onRoutineDeleted: (id: string) => void;
    initialRoutine?: WorkoutRoutine | null;
}

export default function ManualWorkoutModal({ visible, onClose, onRoutineCreated, onRoutineDeleted, initialRoutine }: Props) {
    const { colors } = useTheme();
    const { t } = useLanguage();

    const [mode, setMode] = useState<'ai' | 'manual'>('manual');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialRoutine) {
                setName(initialRoutine.name);
                setDescription(initialRoutine.description || '');
                setTags(initialRoutine.tags?.join(', ') || '');
                setExercises(JSON.parse(JSON.stringify(initialRoutine.exercises)));
                setMode('manual');
            } else {
                resetForm();
            }
        }
    }, [visible, initialRoutine]);

    const handleDelete = () => {
        if (initialRoutine) {
            customAlert(
                'Delete Routine',
                'Are you sure you want to delete this routine? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => onRoutineDeleted(initialRoutine.id)
                    }
                ]
            );
        }
    };

    // AI specific states
    const [goal, setGoal] = useState('');
    const [experience, setExperience] = useState('Intermediate');
    const [equipment, setEquipment] = useState('Full Gym');

    const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
    const EQUIPMENT_OPTIONS = ['Full Gym', 'Home Gym', 'Only Dumbbells', 'Bodyweight'];

    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

    const showExperienceSelector = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [...EXPERIENCE_OPTIONS, 'Cancel'],
                    cancelButtonIndex: EXPERIENCE_OPTIONS.length,
                    title: 'Select Experience Level'
                },
                (buttonIndex: number) => {
                    if (buttonIndex < EXPERIENCE_OPTIONS.length) {
                        setExperience(EXPERIENCE_OPTIONS[buttonIndex]);
                    }
                }
            );
        } else {
            customAlert(
                'Select Experience Level',
                '',
                EXPERIENCE_OPTIONS.map(opt => ({
                    text: opt,
                    onPress: () => setExperience(opt)
                }))
            );
        }
    };

    const showEquipmentSelector = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [...EQUIPMENT_OPTIONS, 'Cancel'],
                    cancelButtonIndex: EQUIPMENT_OPTIONS.length,
                    title: 'Select Equipment'
                },
                (buttonIndex: number) => {
                    if (buttonIndex < EQUIPMENT_OPTIONS.length) {
                        setEquipment(EQUIPMENT_OPTIONS[buttonIndex]);
                    }
                }
            );
        } else {
            customAlert(
                'Select Equipment',
                '',
                EQUIPMENT_OPTIONS.map(opt => ({
                    text: opt,
                    onPress: () => setEquipment(opt)
                }))
            );
        }
    };

    const handleQuickAdd = (exerciseName: string) => {
        setEditingExerciseId(null);
        setSelectedExercise(exerciseName);
    };

    const handleEditExercise = (ex: Exercise) => {
        setEditingExerciseId(ex.id);
        setSelectedExercise(ex.name);
    };

    const handleConfirmSelection = (sets: number, reps: number) => {
        if (selectedExercise) {
            if (editingExerciseId) {
                // Update existing exercise
                setExercises(prev => prev.map(ex => {
                    if (ex.id !== editingExerciseId) return ex;
                    return {
                        ...ex,
                        sets: Array.from({ length: sets }).map((_, i) => ({
                            // Keep existing attributes if possible, or just reset to pending
                            id: ex.sets[i]?.id || Crypto.randomUUID(),
                            reps: reps,
                            weight: ex.sets[i]?.weight || 0,
                            status: 'pending'
                        }))
                    };
                }));
            } else {
                // Add new exercise
                const newEx: Exercise = {
                    id: Crypto.randomUUID(),
                    name: selectedExercise,
                    muscleGroup: 'General',
                    sets: Array.from({ length: sets }).map(() => ({
                        id: Crypto.randomUUID(),
                        reps: reps,
                        weight: 0,
                        status: 'pending'
                    }))
                };
                setExercises([...exercises, newEx]);
            }
            setSelectedExercise(null);
            setEditingExerciseId(null);
        }
    };

    const handleRemoveExercise = (id: string) => {
        setExercises(exercises.filter(e => e.id !== id));
    };

    const handleGenerate = async () => {
        if (!goal.trim()) {
            customAlert('AI Coach', 'Please provide a goal for your routine.');
            return;
        }
        setLoading(true);
        try {
            const routine = await generateWorkout(goal, equipment, experience);
            if (routine) {
                setName(routine.name);
                setExercises(routine.exercises);
                setDescription(goal); // Use goal as description
                setMode('manual'); // Switch to manual to review
            }
        } catch (error) {
            customAlert('Error', 'Failed to generate routine. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            customAlert('Missing Name', 'Please give your routine a name.');
            return;
        }
        if (exercises.length === 0) {
            customAlert('Empty Routine', 'Please add at least one exercise.');
            return;
        }

        const newRoutine: WorkoutRoutine = {
            id: initialRoutine?.id || Crypto.randomUUID(),
            name: name.trim(),
            description: description.trim(),
            tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            exercises: exercises,
            date: initialRoutine?.date || new Date().toISOString(),
            duration: initialRoutine?.duration || 0,
            status: initialRoutine?.status || 'planned',
            isFavorite: initialRoutine?.isFavorite || false
        };

        onRoutineCreated(newRoutine);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setTags('');
        setExercises([]);
        setMode('manual');
        setGoal('');
        setExperience('Intermediate');
        setEquipment('Full Gym');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.headerTitle}>Crear Rutina</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color="#94A3B8" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, mode === 'ai' && styles.activeToggle]}
                            onPress={() => setMode('ai')}
                        >
                            <Sparkles size={18} color={mode === 'ai' ? '#3B82F6' : '#94A3B8'} />
                            <Text style={[styles.toggleText, mode === 'ai' && styles.activeToggleText]}>Preguntar a IA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, mode === 'manual' && styles.activeToggleManual]}
                            onPress={() => setMode('manual')}
                        >
                            <PenTool size={18} color={mode === 'manual' ? '#FFFFFF' : '#94A3B8'} />
                            <Text style={[styles.toggleText, mode === 'manual' && styles.activeToggleTextManual]}>Creación Manual</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'ai' ? (
                        <View style={styles.aiCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <Sparkles size={24} color="#3B82F6" style={{ marginRight: 10 }} />
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>Preguntar a IA</Text>
                            </View>

                            <Text style={styles.inputLabel}>Tu Objetivo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Build massive chest"
                                placeholderTextColor="#CBD5E1"
                                value={goal}
                                onChangeText={setGoal}
                            />

                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Experiencia</Text>
                                    <TouchableOpacity style={styles.pseudoPicker} onPress={showExperienceSelector}>
                                        <Text style={styles.pseudoPickerText}>{experience}</Text>
                                        <Plus size={16} color="#0F172A" style={{ transform: [{ rotate: '45deg' }] }} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Equipamiento</Text>
                                    <TouchableOpacity style={styles.pseudoPicker} onPress={showEquipmentSelector}>
                                        <Text style={styles.pseudoPickerText}>{equipment}</Text>
                                        <Plus size={16} color="#0F172A" style={{ transform: [{ rotate: '45deg' }] }} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, { marginTop: 24, backgroundColor: '#94A3B8' + '80' }]}
                                onPress={handleGenerate}
                                disabled={loading || !goal.trim()}
                            >
                                <Sparkles color={loading || !goal.trim() ? '#94A3B8' : '#FFF'} size={20} style={{ marginRight: 8 }} />
                                <Text style={[styles.primaryButtonText, { color: loading || !goal.trim() ? '#94A3B8' : '#FFF' }]}>
                                    {loading ? 'Generating...' : 'Generate Routine'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Routine Name */}
                            <Text style={styles.inputLabel}>Nombre de la Rutina</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Monday Chest Day"
                                placeholderTextColor="#CBD5E1"
                                value={name}
                                onChangeText={setName}
                            />

                            {/* Description */}
                            <Text style={styles.inputLabel}>Descripción</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Brief description..."
                                placeholderTextColor="#CBD5E1"
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />

                            {/* Tags */}
                            <Text style={styles.inputLabel}>Etiquetas</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Comma separated"
                                placeholderTextColor="#CBD5E1"
                                value={tags}
                                onChangeText={setTags}
                            />

                            {/* Quick Add Exercises */}
                            <Text style={styles.inputLabel}>Agregar Ejercicios Rápidos</Text>
                            <View style={styles.chipContainer}>
                                {QUICK_EXERCISES.map((ex) => (
                                    <TouchableOpacity
                                        key={ex}
                                        style={styles.chip}
                                        onPress={() => handleQuickAdd(ex)}
                                    >
                                        <Text style={styles.chipText}>+ {ex}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Exercise Sequence */}
                    <View style={styles.sequenceHeader}>
                        <Text style={styles.sequenceTitle}>EXERCISE SEQUENCE</Text>
                        <Text style={styles.sequenceCount}>{exercises.length} ITEMS</Text>
                    </View>

                    <View style={styles.exerciseList}>
                        {exercises.map((ex, index) => (
                            <View key={ex.id} style={styles.exerciseItem}>
                                <TouchableOpacity
                                    onPress={() => handleEditExercise(ex)}
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <View style={{ backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <Text style={{ color: '#64748B', fontWeight: 'bold' }}>{index + 1}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.exerciseText}>{ex.name}</Text>
                                        <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                                            {ex.sets.length} sets × {ex.sets[0]?.reps || 0} reps
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleRemoveExercise(ex.id)} style={{ padding: 8 }}>
                                    <Trash2 size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <SetRepSelectionModal
                    visible={!!selectedExercise}
                    onClose={() => {
                        setSelectedExercise(null);
                        setEditingExerciseId(null);
                    }}
                    onConfirm={handleConfirmSelection}
                    exerciseName={selectedExercise || ''}
                    initialSets={editingExerciseId ? exercises.find(e => e.id === editingExerciseId)?.sets.length : 3}
                    initialReps={editingExerciseId ? exercises.find(e => e.id === editingExerciseId)?.sets[0]?.reps : 10}
                    confirmButtonText={editingExerciseId ? "Update Exercise" : "Add to Workout"}
                />

                {/* Footer Action */}
                <View style={styles.footer}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {initialRoutine && (
                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 1, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' }]}
                                onPress={handleDelete}
                            >
                                <Trash2 color="#EF4444" size={20} style={{ marginRight: 8 }} />
                                <Text style={[styles.primaryButtonText, { color: '#EF4444' }]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                        {mode === 'ai' ? (
                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 2 }]}
                                onPress={handleGenerate}
                                disabled={loading}
                            >
                                <Sparkles color="#FFF" size={20} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>{loading ? 'Generating...' : 'Generate with AI'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.primaryButton, { flex: initialRoutine ? 2 : 1 }]} onPress={handleSave}>
                                <Save color="#FFF" size={20} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>Guardar Rutina</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    logo: {
        width: 32,
        height: 32,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    closeButton: {
        padding: 8,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    activeToggle: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    // The manual toggle in the image is blue when selected
    activeToggleManual: {
        backgroundColor: '#2563EB',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
        marginLeft: 8,
    },
    activeToggleText: {
        color: '#3B82F6',
    },
    activeToggleTextManual: {
        color: '#FFFFFF',
    },
    inputLabel: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#0F172A',
        marginBottom: 20,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
    },
    chip: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    chipText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    sequenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginBottom: 16,
    },
    sequenceTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    sequenceCount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    exerciseList: {
        marginBottom: 20,
    },
    exerciseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    exerciseText: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    primaryButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    aiCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
    },
    pseudoPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
    },
    pseudoPickerText: {
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
    }
});
