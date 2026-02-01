import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { WorkoutRoutine } from '../types';
import { X, Clock, Calendar, CheckCircle2, Edit3, Zap, Smile, Coffee, MessageSquare, Dumbbell, ChevronRight } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    workout: WorkoutRoutine | null;
    onEdit?: (workout: WorkoutRoutine) => void;
    onDoAgain?: (workout: WorkoutRoutine) => void;
}

export default function WorkoutDetailModal({ visible, onClose, workout, onEdit, onDoAgain }: Props) {
    const { colors } = useTheme();

    if (!workout) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const stats = React.useMemo(() => {
        let total = 0;
        let completed = 0;
        workout.exercises.forEach(ex => {
            total += ex.sets.length;
            completed += ex.sets.filter(s => s.status === 'completed').length;
        });
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, percent };
    }, [workout]);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {workout.status === 'completed' ? 'Workout Summary' : 'Routine Details'}
                        </Text>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{workout.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {workout.status !== 'completed' && onEdit && (
                            <TouchableOpacity
                                onPress={() => {
                                    onEdit(workout);
                                    onClose();
                                }}
                                style={[styles.closeButton, { marginRight: 12 }]}
                            >
                                <Edit3 color={colors.primary} size={24} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Summary Info */}
                    <View style={styles.summaryRow}>
                        {workout.status === 'completed' && (
                            <>
                                <View style={styles.summaryItem}>
                                    <Calendar size={18} color={colors.primary} />
                                    <Text style={[styles.summaryText, { color: colors.text }]}>{formatDate(workout.date)}</Text>
                                </View>
                                {workout.duration > 0 && (
                                    <View style={styles.summaryItem}>
                                        <Clock size={18} color={colors.primary} />
                                        <Text style={[styles.summaryText, { color: colors.text }]}>{formatDuration(workout.duration)}</Text>
                                    </View>
                                )}
                                {workout.sensation && (
                                    <View style={styles.summaryItem}>
                                        {workout.sensation === 'Energized' && <Zap size={18} color="#FFD700" />}
                                        {workout.sensation === 'Neutral' && <Smile size={18} color="#22C55E" />}
                                        {workout.sensation === 'Tired' && <Coffee size={18} color="#64748B" />}
                                        <Text style={[styles.summaryText, { color: colors.text }]}>{workout.sensation}</Text>
                                    </View>
                                )}
                            </>
                        )}
                        {workout.status !== 'completed' && workout.description && (
                            <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 8 }}>
                                {workout.description}
                            </Text>
                        )}
                        {workout.status === 'completed' && workout.notes && (
                            <View style={[styles.notesContainer, { backgroundColor: colors.card, borderColor: '#F1F5F9' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <MessageSquare size={16} color={colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={{ fontWeight: 'bold', color: colors.text }}>Notes</Text>
                                </View>
                                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                                    {workout.notes}
                                </Text>
                            </View>
                        )}
                        {workout.status === 'completed' && workout.imageUri && (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: workout.imageUri }} style={styles.workoutImage} />
                            </View>
                        )}
                    </View>

                    {/* Results Summary */}
                    {workout.status === 'completed' && (
                        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: '#F1F5F9' }]}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{stats.completed}/{stats.total}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sets Done</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: '#F1F5F9' }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{stats.percent}%</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion</Text>
                            </View>
                        </View>
                    )}

                    {/* Exercises */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
                    {workout.exercises.map((exercise, idx) => (
                        <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.card }]}>
                            <View style={styles.exerciseHeader}>
                                <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                                <View style={styles.muscleBadge}>
                                    <Text style={styles.muscleText}>{exercise.muscleGroup}</Text>
                                </View>
                            </View>

                            {exercise.sets.map((set, sIdx) => (
                                <View key={set.id} style={styles.setRow}>
                                    <Text style={[styles.setText, { color: colors.textSecondary }]}>Set {sIdx + 1}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={[styles.setData, { color: colors.text }]}>{set.reps} reps</Text>
                                        <Text style={{ color: colors.textSecondary, marginHorizontal: 8 }}>x</Text>
                                        <Text style={[styles.setData, { color: colors.text }]}>{set.weight} kg</Text>
                                        <View style={{ marginLeft: 12 }}>
                                            {set.status === 'completed' && <CheckCircle2 size={16} color="#22C55E" />}
                                            {set.status === 'partial' && (
                                                <View style={{ transform: [{ rotate: '45deg' }] }}>
                                                    <View style={{ width: 14, height: 2, backgroundColor: '#F59E0B' }} />
                                                </View>
                                            )}
                                            {set.status === 'failed' && <X size={16} color="#EF4444" />}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    {workout.status === 'completed' && onDoAgain && (
                        <TouchableOpacity
                            onPress={() => onDoAgain(workout)}
                            style={[styles.doAgainButton, { backgroundColor: colors.primary }]}
                        >
                            <Dumbbell size={20} color={colors.background} />
                            <Text style={[styles.doAgainButtonText, { color: colors.background }]}>Do it again</Text>
                            <ChevronRight size={20} color={colors.background} />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    closeButton: {
        padding: 8,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 0,
    },
    summaryRow: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 24,
    },
    notesContainer: {
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    imageContainer: {
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 250,
        width: '100%',
    },
    workoutImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    summaryText: {
        fontSize: 16,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    exerciseCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    muscleBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    muscleText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    setData: {
        fontSize: 16,
        fontWeight: '600',
    },
    setText: {
        fontSize: 14,
    },
    doAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        marginTop: 16,
        marginBottom: 32,
        gap: 10,
    },
    doAgainButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 32,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 40,
    }
});
