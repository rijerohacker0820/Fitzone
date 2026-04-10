import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Calendar as CalendarIcon, Clock, Plus, ChevronRight, Check, Dumbbell } from 'lucide-react-native';
import { getWorkoutLogs, getWeeklyPlan, saveWeeklyPlan, getRoutines } from '../services/storage';
import { WorkoutRoutine } from '../types';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');
const LOGO_IMG = require('../assets/logo.png');

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function ScheduleScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'Weekly' | 'History'>('Weekly');
    const [weeklyPlan, setWeeklyPlan] = useState<Record<string, string | null>>({});
    const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutRoutine[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const [plan, rts, logs] = await Promise.all([
            getWeeklyPlan(),
            getRoutines(),
            getWorkoutLogs()
        ]);
        setWeeklyPlan(plan);
        setRoutines(rts);
        setWorkoutLogs(logs);
    };

    const handleAssign = (day: string) => {
        setSelectedDay(day);
        setModalVisible(true);
    };

    const selectRoutine = async (routineId: string | null) => {
        if (!selectedDay) return;
        const newPlan = { ...weeklyPlan, [selectedDay]: routineId };
        setWeeklyPlan(newPlan);
        await saveWeeklyPlan(newPlan);
        setModalVisible(false);
        setSelectedDay(null);
    };

    const getRoutineName = (id: string | null) => {
        if (!id) return t('restDay');
        const r = routines.find(rt => rt.id === id);
        return r ? r.name : t('restDay');
    };

    // Calendar logic for History
    const renderCalendar = () => {
        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
        const calendarDays = [];

        // Adjust for MON start (Image 2 starts with SUN)
        // Image 2 shows SUN MON TUE WED THU FRI SAT
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Header
        const header = (
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}>
                    <ChevronLeft color={colors.textSecondary} size={20} />
                </TouchableOpacity>
                <Text style={[styles.calendarMonthText, { color: colors.text }]}>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
                <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}>
                    <ChevronRight color={colors.textSecondary} size={20} />
                </TouchableOpacity>
            </View>
        );

        // Weekday labels
        const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const weekDayLabels = (
            <View style={styles.weekDaysContainer}>
                {weekDays.map(d => <Text key={d} style={styles.weekDayLabel}>{d}</Text>)}
            </View>
        );

        // Grid
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d).toDateString();
            const isSelected = selectedDate.toDateString() === dateStr;
            const hasWorkout = workoutLogs.some(log => new Date(log.date).toDateString() === dateStr);

            calendarDays.push(
                <TouchableOpacity
                    key={d}
                    onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d))}
                    style={[
                        styles.calendarDayCell,
                        isSelected && { backgroundColor: colors.primary, borderRadius: 12 }
                    ]}
                >
                    <Text style={[
                        styles.calendarDayText,
                        { color: isSelected ? '#FFF' : colors.text },
                        !isSelected && !hasWorkout && { color: colors.textSecondary }
                    ]}>
                        {d}
                    </Text>
                    {hasWorkout && (
                        <View style={[styles.workoutDot, { backgroundColor: isSelected ? '#FFF' : colors.primary }]} />
                    )}
                </TouchableOpacity>
            );
        }

        return (
            <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
                {header}
                {weekDayLabels}
                <View style={styles.calendarGrid}>
                    {calendarDays}
                </View>
            </View>
        );
    };

    const renderHistoryList = () => {
        const selectedLogs = workoutLogs.filter(log => new Date(log.date).toDateString() === selectedDate.toDateString());

        return (
            <View style={styles.historyListContainer}>
                <View style={styles.historySectionHeader}>
                    <CalendarIcon size={18} color={colors.primary} />
                    <Text style={[styles.historySectionTitle, { color: colors.text }]}>
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>

                {selectedLogs.length === 0 ? (
                    <View style={styles.emptyHistory}>
                        <Text style={{ color: colors.textSecondary }}>{t('noWorkoutsOnDay')}</Text>
                    </View>
                ) : (
                    selectedLogs.map((log, index) => (
                        <View key={index} style={[styles.historyItem, { backgroundColor: colors.card }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.historyItemName, { color: colors.text }]}>{log.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Clock size={12} color={colors.textSecondary} />
                                    <Text style={[styles.historyItemMeta, { color: colors.textSecondary }]}>
                                        {Math.floor(log.duration / 60)}:{(log.duration % 60).toString().padStart(2, '0')}
                                    </Text>
                                    <View style={[styles.sensationBadge, { backgroundColor: '#F1F5F9' }]}>
                                        <Text style={styles.sensationText}>{log.sensation || 'Good'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.historyTypeIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Dumbbell size={18} color={colors.primary} />
                            </View>
                        </View>
                    ))
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.text} size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Image
                        source={LOGO_IMG}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('schedule')}</Text>
                </View>
            </View>

            <View style={styles.tabContainer}>
                <View style={[styles.tabBackground, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Weekly')}
                        style={[styles.tab, activeTab === 'Weekly' && { backgroundColor: colors.primary }]}
                    >
                        <CalendarIcon size={18} color={activeTab === 'Weekly' ? '#FFF' : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: activeTab === 'Weekly' ? '#FFF' : colors.textSecondary }]}>{t('weeklyPlan')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('History')}
                        style={[styles.tab, activeTab === 'History' && { backgroundColor: colors.primary }]}
                    >
                        <Clock size={18} color={activeTab === 'History' ? '#FFF' : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: activeTab === 'History' ? '#FFF' : colors.textSecondary }]}>{t('history')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {activeTab === 'Weekly' ? (
                    <View style={styles.weeklyContainer}>
                        <View style={styles.planHeader}>
                            <CalendarIcon size={16} color={colors.textSecondary} />
                            <Text style={[styles.planSubTitle, { color: colors.textSecondary }]}>{t('planWeekAhead')}</Text>
                        </View>

                        <View style={styles.weeklyGrid}>
                            {DAYS.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    onPress={() => handleAssign(day)}
                                    style={[
                                        styles.dayCard,
                                        { backgroundColor: colors.card, width: day === 'SUN' ? width - 40 : (width - 60) / 2 }
                                    ]}
                                >
                                    <View style={[styles.dayCardHeader, { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
                                        {day === 'SUN' ? (
                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={[styles.dayLabel, { color: colors.text }]}>{day}</Text>
                                                <View style={{ width: 1, height: 16, backgroundColor: '#E2E8F0', marginLeft: 15 }} />
                                            </View>
                                        ) : (
                                            <Text style={[styles.dayLabel, { color: colors.text }]}>{day}</Text>
                                        )}
                                        <Plus
                                            size={16}
                                            color={colors.textSecondary}
                                            style={day === 'SUN' ? { position: 'absolute', right: 0 } : null}
                                        />
                                    </View>
                                    <View style={styles.dayCardBody}>
                                        <Text style={[
                                            styles.routineName,
                                            { color: weeklyPlan[day] ? colors.text : '#CBD5E1' }
                                        ]}>
                                            {getRoutineName(weeklyPlan[day])}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.historyContainer}>
                        {renderCalendar()}
                        {renderHistoryList()}
                    </View>
                )}
            </ScrollView>

            {/* Routine Selection Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('assignRoutineTo').replace('{day}', selectedDay || '')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Plus size={24} color={colors.text} transform={[{ rotate: '45deg' }]} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                            <TouchableOpacity
                                onPress={() => selectRoutine(null)}
                                style={[
                                    styles.optionCard,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: weeklyPlan[selectedDay!] ? 'transparent' : colors.primary,
                                        borderWidth: weeklyPlan[selectedDay!] ? 0 : 2
                                    }
                                ]}
                            >
                                <View style={styles.optionContent}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>{t('restDay')}</Text>
                                        {!weeklyPlan[selectedDay!] && (
                                            <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                                                <Check size={14} color="#FFF" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                        {t('restDayDesc')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {routines.map(routine => {
                                const isSelected = weeklyPlan[selectedDay!] === routine.id;
                                return (
                                    <TouchableOpacity
                                        key={routine.id}
                                        onPress={() => selectRoutine(routine.id)}
                                        style={[
                                            styles.optionCard,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor: isSelected ? colors.primary : 'transparent',
                                                borderWidth: isSelected ? 2 : 0
                                            }
                                        ]}
                                    >
                                        <View style={styles.optionContent}>
                                            <View style={styles.cardHeaderRow}>
                                                <Text style={[styles.optionTitle, { color: colors.text }]}>{routine.name}</Text>
                                                {isSelected && (
                                                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                                                        <Check size={14} color="#FFF" />
                                                    </View>
                                                )}
                                            </View>

                                            {routine.tags && routine.tags.length > 0 && (
                                                <View style={styles.tagsRow}>
                                                    {routine.tags.map((tag, idx) => (
                                                        <View key={idx} style={[styles.tagPill, { backgroundColor: colors.background }]}>
                                                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}

                                            {routine.description ? (
                                                <Text style={[styles.optionDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                                                    {routine.description}
                                                </Text>
                                            ) : null}

                                            <View style={[styles.cardFooter, { backgroundColor: colors.background }]}>
                                                <Dumbbell size={16} color={colors.primary} />
                                                <Text style={[styles.exerciseCount, { color: colors.text }]}>
                                                    {routine.exercises.length} {t('exercises').toLowerCase()}
                                                </Text>
                                                <View style={styles.verticalDivider} />
                                                <Text style={[styles.exerciseList, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {routine.exercises.map(e => e.name).join(', ')}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        gap: 12,
    },
    logo: {
        width: 32,
        height: 32,
        borderRadius: 6,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    tabContainer: {
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    tabBackground: {
        flexDirection: 'row',
        padding: 5,
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    tabText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    weeklyContainer: {
        paddingHorizontal: 20,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        marginTop: 10,
    },
    planSubTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    weeklyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    dayCard: {
        borderRadius: 20,
        height: 120,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    dayCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dayCardBody: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routineName: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    historyContainer: {
        paddingHorizontal: 20,
    },
    calendarContainer: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    calendarMonthText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    weekDaysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDayCell: {
        width: (width - 82) / 7,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    calendarDayText: {
        fontSize: 15,
        fontWeight: '600',
    },
    workoutDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        bottom: 5,
    },
    historyListContainer: {
        marginTop: 10,
    },
    historySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    historySectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    historyItemName: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    historyItemMeta: {
        fontSize: 13,
        marginLeft: 4,
        fontWeight: '500',
    },
    historyTypeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sensationBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 10,
    },
    sensationText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
    },
    emptyHistory: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    optionCard: {
        borderRadius: 20,
        marginBottom: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderWidth: 2,
    },
    optionContent: {
        flex: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    tagPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        marginTop: 4,
    },
    exerciseCount: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
    },
    verticalDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 10,
    },
    exerciseList: {
        fontSize: 13,
        flex: 1,
    }
});
