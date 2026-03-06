import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Modal, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/types';
import ACWRChart from '../components/ACWRChart';
import { ACWRData, WorkoutRoutine } from '../types';
import { calculateACWR } from '../utils/acwr';
import { getWorkoutLogs, saveWorkoutLog, saveRoutine, getRoutines } from '../services/storage';
import { Plus, Zap, Award, CheckCircle2, Dumbbell, X, ChevronRight } from 'lucide-react-native';
import StreakCard from '../components/StreakCard';
import ActionButtons from '../components/ActionButtons';
import FABMenu from '../components/FABMenu';
import ManualWorkoutModal from '../components/ManualWorkoutModal';
import * as Crypto from 'expo-crypto';
import { useSquads } from '../context/SquadContext';

const LOGO_IMG = require('../assets/logo.png');
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20px padding on each side parent

export default function HomeScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { user } = useUser();
    const navigation = useNavigation<any>();
    const { squads } = useSquads();
    const [acwrData, setAcwrData] = useState<ACWRData[]>([]);
    const [recentLogs, setRecentLogs] = useState<WorkoutRoutine[]>([]);
    const [allRoutines, setAllRoutines] = useState<WorkoutRoutine[]>([]);
    const [status, setStatus] = useState<'Optimal' | 'Fatigue Risk' | 'Recovery'>('Optimal');
    const [fabMenuVisible, setFabMenuVisible] = useState(false);
    const [manualModalVisible, setManualModalVisible] = useState(false);
    const [existingRoutineModalVisible, setExistingRoutineModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Mock data if empty for demo
        // In real app, fetch logs -> calculateACWR
        // For visual demo, we generate a trend
        const mockData: ACWRData[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) { // 30 days
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            mockData.push({
                date: d.toISOString(),
                acuteLoad: 0, chronicLoad: 0,
                ratio: 0.8 + (Math.random() * 0.7), // 0.8 to 1.5
                status: 'Optimal'
            });
        }
        setAcwrData(mockData);

        // Real logic integration:
        const logs = await getWorkoutLogs();
        // Sort logs by date desc
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentLogs(logs.slice(0, 5)); // Take latest 5
        setAllRoutines(await getRoutines());
        // const currentACWR = calculateACWR(logs);
        // setStatus(currentACWR.status);
    };

    // Calculate best streak
    const bestSquad = React.useMemo(() => {
        if (!squads || squads.length === 0) return null;
        return squads.reduce((prev, current) => (prev.streak > current.streak) ? prev : current);
    }, [squads]);

    const displaySquadName = bestSquad ? bestSquad.name : 'Iron Squad';
    const displayStreak = bestSquad ? bestSquad.streak : 0;

    const handleStartQuickWorkout = () => {
        // Create a blank "Quick Workout" routine
        const quickWorkout: WorkoutRoutine = {
            id: Crypto.randomUUID(),
            name: 'Quick Workout',
            exercises: [],
            date: new Date().toISOString(),
            duration: 0,
            status: 'in-progress',
            tags: ['Quick Workout']
        };

        setFabMenuVisible(false);
        navigation.navigate('ActiveWorkout', { routine: quickWorkout });
    };



    const handleRoutineCreated = async (routine: WorkoutRoutine) => {
        await saveRoutine(routine);
        await loadData();
        setManualModalVisible(false);
    };

    const handleSchedulePress = () => {
        navigation.navigate('Schedule');
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
                {/* Logo */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={LOGO_IMG}
                        style={{ width: 40, height: 40, borderRadius: 6 }}
                        resizeMode="contain"
                    />
                </View>
                {/* Profile Avatar */}
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FECACA', borderWidth: 2, borderColor: colors.secondary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Text style={{ color: '#7F1D1D', fontWeight: 'bold' }}>{user?.name?.charAt(0)}</Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>{t('welcomeBack')}, {user?.name?.split(' ')[0]}</Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}>{t('momentumMsg')}</Text>
            </View>

            {/* Squads Carousel */}
            <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>{t('yourSquads')}</Text>
                <View>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH}
                        snapToAlignment="center"
                        // ensure the scrollview children can take full width
                        style={{ width: '100%', overflow: 'visible' }}
                    >
                        {(!squads || squads.length === 0) ? (
                            <View style={{ width: CARD_WIDTH }}>
                                <StreakCard
                                    squadName={t('joinSquad')}
                                    streak={0}
                                    onPress={() => navigation.navigate('Social')}
                                    isActive={false}
                                    members={[]}
                                />
                            </View>
                        ) : (
                            squads.map((squad) => (
                                <View key={squad.id} style={{ width: CARD_WIDTH }}>
                                    {/* Add right padding inside the item to create visual gap if needed, or keeping it tight */}
                                    <View style={{ width: '100%', paddingRight: 8 }}>
                                        <StreakCard
                                            squadName={squad.name}
                                            streak={squad.streak}
                                            onPress={() => navigation.navigate('SquadDetail', { squadId: squad.id })}
                                            isActive={squad.streak > 0}
                                            members={squad.membersList}
                                        />
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* Fitness Status Card (ACWR) */}
            <ACWRChart data={acwrData} />

            {/* Action Buttons */}
            <ActionButtons onLogPress={() => setFabMenuVisible(true)} onSchedulePress={handleSchedulePress} />

            {/* Recent History Header */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>{t('recentHistory')}</Text>
            {/* Placeholder for history items */}
            <View style={{ marginBottom: 40 }}>
                {recentLogs.length === 0 ? (
                    <View style={{ height: 100, backgroundColor: colors.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary }}>{t('noWorkouts')}</Text>
                    </View>
                ) : (
                    recentLogs.map((log, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => navigation.navigate('WorkoutSummary', { log })}
                            style={{
                                backgroundColor: colors.card,
                                padding: 16,
                                borderRadius: 16,
                                marginBottom: 12,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                    width: 40, height: 40,
                                    borderRadius: 12,
                                    backgroundColor: colors.primary + '20', // reduced opacity
                                    justifyContent: 'center', alignItems: 'center',
                                    marginRight: 12
                                }}>
                                    {log.tags && log.tags.includes('Quick Workout') ? (
                                        <Zap size={20} color={colors.primary} />
                                    ) : (
                                        <Dumbbell size={20} color={colors.primary} />
                                    )}
                                </View>
                                <View>
                                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{log.name}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        {new Date(log.date).toLocaleDateString()} • {Math.floor(log.duration / 60)} min
                                    </Text>
                                </View>
                            </View>
                            <View style={{ backgroundColor: '#F0FFF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: 'bold' }}>{t('done')}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <FABMenu
                visible={fabMenuVisible}
                onClose={() => setFabMenuVisible(false)}
                onAdd={handleStartQuickWorkout}
                onBuild={() => setManualModalVisible(true)}
                onExisting={() => {
                    setFabMenuVisible(false);
                    // Open a selector. For now, since we may not have the routines loaded in HomeScreen state yet or we want a dedicated UI,
                    // we can either fetch them now or navigate to Routines tab.
                    // However, to fulfill "like the Add button on routine screen", it implies an inline flow.
                    // Let's assume we want to show a picker.
                    // For simplicity and robustness, let's navigate to Routines screen for now?
                    // User says: "in case i wanna do one of the routines i already created".
                    // Navigating to Routines tab is the most robust way to "do one of the routines".
                    // But if they are in "Log Workout", maybe they want a quick picker.
                    // I'll implement a quick picker modal here using the routines data.
                    setExistingRoutineModalVisible(true);
                }}
            />

            <ManualWorkoutModal
                visible={manualModalVisible}
                onClose={() => setManualModalVisible(false)}
                onRoutineCreated={handleRoutineCreated}
                onRoutineDeleted={() => { }}
                initialRoutine={null}
            />

            {/* Existing Routine Picker Modal */}
            <Modal
                visible={existingRoutineModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setExistingRoutineModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{t('selectRoutine')}</Text>
                        <TouchableOpacity onPress={() => setExistingRoutineModalVisible(false)} style={{ padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 }}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={allRoutines}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    setExistingRoutineModalVisible(false);
                                    navigation.navigate('ActiveWorkout', { routine: item });
                                }}
                                style={{
                                    backgroundColor: colors.card,
                                    padding: 16,
                                    borderRadius: 16,
                                    marginBottom: 12,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0'
                                }}
                            >
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{item.name}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                                        {item.exercises.length} {t('exercises')}
                                    </Text>
                                </View>
                                <ChevronRight color={colors.textSecondary} size={20} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ color: colors.textSecondary }}>{t('noRoutinesFound')}</Text>
                            </View>
                        }
                    />
                </View>
            </Modal>

        </ScrollView>
    );
}
