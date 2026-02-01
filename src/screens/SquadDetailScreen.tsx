import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, TouchableWithoutFeedback, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ChevronLeft, Flame, MoreVertical, Trophy, Check, Target, Zap, Clock, Send, Plus, Dumbbell, X, Edit2, LogOut, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import SelectRoutineModal from '../components/SelectRoutineModal';
import { WorkoutRoutine } from '../types';
import { useSquads } from '../context/SquadContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../navigation/types';

interface SquadMember {
    id: string;
    name: string;
    avatarColor: string;
    sessionsCompleted: number;
    sessionsTarget: number;
    streak: boolean;
    isCurrentUser?: boolean;
    profileImage?: string;
}

interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    type?: 'text' | 'routine' | 'exercise';
    routineId?: string;
    routineName?: string;
    exerciseName?: string;
    sets?: number;
    reps?: number;
}

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SquadDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'SquadDetail'>;
type SquadDetailRouteProp = RouteProp<RootStackParamList, 'SquadDetail'>;

export default function SquadDetailScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation<SquadDetailNavProp>();
    const route = useRoute<SquadDetailRouteProp>();

    // Squad Context
    const { getSquad, updateSquad } = useSquads();
    const { user } = useUser();
    const squadId = route.params?.squadId || '1'; // Default to 1 if not passed
    const squad = getSquad(squadId);

    // Squad State (initialized from context)
    const [squadName, setSquadName] = useState(squad?.name || 'Iron Squad');
    const [squadIcon, setSquadIcon] = useState(squad?.icon || '👥');
    const [squadImage, setSquadImage] = useState<string | null>(squad?.image || null);

    // Update local state when context changes (optional, but good for sync)
    useEffect(() => {
        if (squad) {
            setSquadName(squad.name);
            setSquadIcon(squad.icon || '👥');
            setSquadImage(squad.image);
        }
    }, [squad]);

    // Handle shared routine from other screens
    useEffect(() => {
        if (route.params?.shareRoutine) {
            const routine = route.params.shareRoutine;
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                senderId: '1', // Current user
                text: '',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'routine',
                routineId: routine.id,
                routineName: routine.name
            };
            setMessages(prev => [...prev, newMessage]);
            setActiveTab('Chat');

            // Clear the param effectively by not reacting to it again? 
            // Better to just let it be, as going back and forth won't re-trigger unless params change or component remounts.
            navigation.setParams({ shareRoutine: undefined });
        }
    }, [route.params?.shareRoutine]);

    // User State - accessing global user state directly in members useMemo


    // UI State
    const [activeTab, setActiveTab] = useState<'Status' | 'Chat'>('Status');
    const [message, setMessage] = useState('');
    const [routineModalVisible, setRoutineModalVisible] = useState(false);
    const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [tempSquadName, setTempSquadName] = useState('');
    const [tempSquadIcon, setTempSquadIcon] = useState('');
    const [tempSquadImage, setTempSquadImage] = useState<string | null>(null);

    // Generate Mock Members based on squad count
    const members = React.useMemo(() => {
        const count = squad?.members || 3;
        const currentUserMember: SquadMember = {
            id: 'current-user',
            name: user.name,
            avatarColor: '#FCA5A5',
            sessionsCompleted: 4,
            sessionsTarget: 4,
            streak: true,
            isCurrentUser: true,

            profileImage: user.profileImage || undefined
        };

        const baseMembers: SquadMember[] = [
            currentUserMember,
            { id: '2', name: 'Sarah', avatarColor: '#93C5FD', sessionsCompleted: 3, sessionsTarget: 4, streak: false },
            { id: '3', name: 'Mike', avatarColor: '#FCD34D', sessionsCompleted: 5, sessionsTarget: 4, streak: true }
        ];

        if (count <= 3) return baseMembers.slice(0, count);

        const extraMembers: SquadMember[] = [];
        const colors = ['#FCA5A5', '#93C5FD', '#FCD34D', '#86EFAC', '#C4B5FD', '#FDBA74'];

        for (let i = 4; i <= count; i++) {
            extraMembers.push({
                id: i.toString(),
                name: `Member ${i}`,
                avatarColor: colors[i % colors.length],
                sessionsCompleted: Math.floor(Math.random() * 5),
                sessionsTarget: 4,
                streak: Math.random() > 0.5
            });
        }

        return [...baseMembers, ...extraMembers];
    }, [squad?.members]);

    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', senderId: '2', text: 'Great workout yesterday team! 🔥', timestamp: '10:30 AM' },
        { id: '2', senderId: '3', text: 'Thanks Sarah! Aiming for 5 sessions this week.', timestamp: '10:32 AM' },
        { id: '3', senderId: '1', text: 'Let\'s gooo! I just finished mine.', timestamp: '10:35 AM' },
    ]);

    const handleSendMessage = () => {
        if (!message.trim()) return;
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: '1', // Current user
            text: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
        setMessage('');
    };

    const handleAddPress = () => {
        Alert.alert(
            t('shareContent'),
            t('shareContentMsg'),
            [
                { text: t('shareRoutine'), onPress: () => setRoutineModalVisible(true) },
                { text: t('shareExercise'), onPress: () => setExerciseModalVisible(true) },
                { text: t('cancel'), style: "cancel" }
            ]
        );
    };

    const handleSelectRoutine = (routine: WorkoutRoutine) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: '1', // Current user
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'routine',
            routineId: routine.id,
            routineName: routine.name
        };
        setMessages([...messages, newMessage]);
        setRoutineModalVisible(false);
    };

    const handleSelectExercise = (name: string, sets: number, reps: number) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: '1', // Current user
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'exercise',
            exerciseName: name,
            sets: sets,
            reps: reps
        };
        setMessages([...messages, newMessage]);
        setExerciseModalVisible(false);
    };

    const handleLeaveSquad = () => {
        setShowOptions(false);
        Alert.alert(
            t('exitSquad'),
            t('exitSquadConfirm'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('exit'),
                    style: "destructive",
                    onPress: () => navigation.goBack()
                }
            ]
        );
    };

    const openEditModal = () => {
        setShowOptions(false);
        setTempSquadName(squadName);
        setTempSquadIcon(squadIcon);
        setTempSquadImage(squadImage);
        setEditModalVisible(true);
    };

    const handleImageSelection = () => {
        Alert.alert(
            t('squadPhoto'),
            t('chooseOption'),
            [
                {
                    text: t('camera'),
                    onPress: takePhoto
                },
                {
                    text: t('gallery'),
                    onPress: pickImage
                },
                {
                    text: t('removePhoto'),
                    style: "destructive",
                    onPress: () => setTempSquadImage(null)
                },
                {
                    text: t('cancel'),
                    style: "cancel"
                }
            ]
        );
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setTempSquadImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(t('permissionRequired'), t('cameraPermissionMsg'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setTempSquadImage(result.assets[0].uri);
        }
    };




    const handleSaveSquad = () => {
        const updates: any = {};

        if (tempSquadName.trim()) {
            setSquadName(tempSquadName);
            updates.name = tempSquadName;
        }
        if (tempSquadIcon.trim()) {
            setSquadIcon(tempSquadIcon);
            updates.icon = tempSquadIcon;
        }
        setSquadImage(tempSquadImage);
        updates.image = tempSquadImage;

        if (Object.keys(updates).length > 0) {
            updateSquad(squadId, updates);
        }
        setEditModalVisible(false);
    };

    const weeklySessionsTarget = 4;
    // Streak Logic: Active only if EVERY member has met their target
    const isStreakActive = React.useMemo(() => {
        return members.every(member => member.sessionsCompleted >= member.sessionsTarget);
    }, [members]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF', zIndex: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
                            <ChevronLeft size={24} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('SquadSettings', { squadId })}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                                {squadImage ? (
                                    <Image source={{ uri: squadImage }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <Text style={{ fontSize: 20 }}>{squadIcon}</Text>
                                )}
                            </View>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginRight: 4 }}>{squadName}</Text>
                                    <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 'bold' }}>{squad?.members || 3} {t('members').toUpperCase()}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFEDD5' }}>
                            <Flame size={14} color="#F97316" fill="#F97316" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#F97316', fontWeight: 'bold', fontSize: 14 }}>{squad?.streak || 0}</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
                                <MoreVertical size={24} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {showOptions && (
                                <View style={{
                                    position: 'absolute',
                                    top: 30,
                                    right: 0,
                                    backgroundColor: '#FFF',
                                    borderRadius: 12,
                                    padding: 8,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                    elevation: 5,
                                    width: 150,
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0',
                                    zIndex: 50
                                }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowOptions(false);
                                            navigation.navigate('SquadSettings', { squadId });
                                        }}
                                        style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 }}
                                    >
                                        <Edit2 size={16} color="#64748B" style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 'bold' }}>{t('settings')}</Text>
                                    </TouchableOpacity>
                                    <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />
                                    <TouchableOpacity
                                        onPress={handleLeaveSquad}
                                        style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 }}
                                    >
                                        <LogOut size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: 'bold' }}>{t('exitSquad')}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>

            {/* Main Content Area */}
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* Tabs */}
                <View style={{ flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 4, marginBottom: 16, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Status')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'Status' ? '#FFF' : 'transparent',
                            borderRadius: 8,
                            shadowColor: activeTab === 'Status' ? '#000' : 'transparent',
                            shadowOpacity: activeTab === 'Status' ? 0.1 : 0,
                            shadowRadius: 2,
                            elevation: activeTab === 'Status' ? 2 : 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6
                        }}
                    >
                        <Zap size={16} color={activeTab === 'Status' ? '#2563EB' : '#64748B'} />
                        <Text style={{ fontWeight: 'bold', color: activeTab === 'Status' ? '#2563EB' : '#64748B', fontSize: 12 }}>{t('status').toUpperCase()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Chat')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'Chat' ? '#FFF' : 'transparent',
                            borderRadius: 8,
                            shadowColor: activeTab === 'Chat' ? '#000' : 'transparent',
                            shadowOpacity: activeTab === 'Chat' ? 0.1 : 0,
                            shadowRadius: 2,
                            elevation: activeTab === 'Chat' ? 2 : 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6
                        }}
                    >
                        <Text style={{ fontWeight: 'bold', color: activeTab === 'Chat' ? '#2563EB' : '#64748B', fontSize: 12 }}>{t('chat').toUpperCase()}</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'Status' ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {/* Hero Card */}
                        <View style={{
                            backgroundColor: isStreakActive ? '#2563EB' : '#FFF',
                            borderRadius: 24,
                            padding: 24,
                            marginBottom: 32,
                            overflow: 'hidden',
                            borderWidth: isStreakActive ? 0 : 1,
                            borderColor: '#E2E8F0',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.05,
                            shadowRadius: 12,
                            elevation: 2
                        }}>
                            <View style={{ flexDirection: 'row' }}>
                                {/* Left: Streak */}
                                <View style={{ alignItems: 'center', paddingRight: 24, borderRightWidth: 1, borderRightColor: isStreakActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9' }}>
                                    <View style={{
                                        width: 64, height: 64, borderRadius: 32,
                                        backgroundColor: isStreakActive ? '#FFF' : '#F1F5F9',
                                        alignItems: 'center', justifyContent: 'center', marginBottom: 12
                                    }}>
                                        <Flame size={32} color={isStreakActive ? '#2563EB' : '#94A3B8'} fill={isStreakActive ? '#2563EB' : '#94A3B8'} />
                                    </View>
                                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: isStreakActive ? '#FFF' : '#64748B', lineHeight: 36 }}>{squad?.streak || 0}</Text>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: isStreakActive ? '#BFDBFE' : '#94A3B8', letterSpacing: 1, marginBottom: 8 }}>{t('weeks').toUpperCase()}</Text>
                                    <View style={{
                                        backgroundColor: isStreakActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                                        borderWidth: isStreakActive ? 0 : 1, borderColor: '#E2E8F0'
                                    }}>
                                        <Text style={{ color: isStreakActive ? '#FFF' : '#475569', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 }}>
                                            {isStreakActive ? t('active').toUpperCase() : t('pending').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Right: Stats */}
                                <View style={{ flex: 1, paddingLeft: 24, justifyContent: 'center', gap: 16 }}>
                                    <View style={{ backgroundColor: isStreakActive ? 'rgba(255,255,255,0.1)' : '#F8FAFC', padding: 12, borderRadius: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View>
                                                <Text style={{ color: isStreakActive ? '#BFDBFE' : '#94A3B8', fontSize: 10, fontWeight: 'bold', marginBottom: 2, letterSpacing: 0.5 }}>{t('teamPower').toUpperCase()}</Text>
                                                <Text style={{ color: isStreakActive ? '#FFF' : '#475569', fontSize: 20, fontWeight: 'bold' }}>67%</Text>
                                            </View>
                                            <Target size={20} color={isStreakActive ? '#BFDBFE' : '#CBD5E1'} />
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: isStreakActive ? 'rgba(255,255,255,0.1)' : '#F8FAFC', padding: 12, borderRadius: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View>
                                                <Text style={{ color: isStreakActive ? '#BFDBFE' : '#94A3B8', fontSize: 10, fontWeight: 'bold', marginBottom: 2, letterSpacing: 0.5 }}>{t('activity').toUpperCase()}</Text>
                                                <Text style={{ color: isStreakActive ? '#FFF' : '#475569', fontSize: 20, fontWeight: 'bold' }}>{squad?.loggedToday || 0}/{squad?.members || 3}</Text>
                                            </View>
                                            <Zap size={20} color={isStreakActive ? '#BFDBFE' : '#CBD5E1'} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Section Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Trophy size={18} color="#D97706" />
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 0.5 }}>{t('weeklyGoalsProgress').toUpperCase()}</Text>
                            </View>
                            <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748B' }}>{t('targetSessions').replace('{target}', weeklySessionsTarget.toString()).toUpperCase()}</Text>
                            </View>
                        </View>

                        {/* Members List */}
                        <View style={{ gap: 16, marginBottom: 32 }}>
                            {members.map((member) => {
                                const progress = Math.min(1, member.sessionsCompleted / member.sessionsTarget);
                                const isGoalMet = member.sessionsCompleted >= member.sessionsTarget;
                                const missingSessions = Math.max(0, member.sessionsTarget - member.sessionsCompleted);
                                // No longer needing local state override, accessing member.profileImage directly (which comes from user context for current user)


                                return (
                                    <View key={member.id} style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: isGoalMet ? '#10B981' : '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TouchableOpacity
                                                    disabled={true}
                                                // Profile photo can only be changed in Profile Screen now
                                                >
                                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: member.avatarColor, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', overflow: 'hidden' }}>
                                                        {member.profileImage ? (
                                                            <Image source={{ uri: member.profileImage }} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <Text style={{ fontSize: 18 }}>😊</Text>
                                                        )}
                                                    </View>
                                                </TouchableOpacity>
                                                {isGoalMet && (
                                                    <View style={{ position: 'absolute', bottom: -2, left: 28, backgroundColor: '#2563EB', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', zIndex: 10 }}>
                                                        <Check size={8} color="#FFF" strokeWidth={4} />
                                                    </View>
                                                )}

                                                <View style={{ marginLeft: 12 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0F172A' }}>{member.name}</Text>
                                                        {member.streak && <Text style={{ fontSize: 10 }}>⭐</Text>}
                                                    </View>
                                                    {isGoalMet ? (
                                                        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#166534' }}>{t('goalMet').toUpperCase()}</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#991B1B' }}>{t('missing').toUpperCase()} {missingSessions}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: isGoalMet ? '#10B981' : '#64748B' }}>{member.sessionsCompleted}/{member.sessionsTarget}</Text>
                                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94A3B8' }}>{t('days').toUpperCase()}</Text>
                                                </View>
                                                {isGoalMet && <Trophy size={16} color="#10B981" style={{ marginTop: 4 }} />}
                                            </View>
                                        </View>

                                        {/* Progress Bar */}
                                        <View style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                            <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: isGoalMet ? '#10B981' : '#F59E0B', borderRadius: 3 }} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Footer Button */}
                        <TouchableOpacity style={{ backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                            <Target size={20} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }}>{t('squadLeaderboard').toUpperCase()}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                ) : (

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                        style={{ flex: 1 }}
                    >
                        <FlatList<ChatMessage>
                            data={messages}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingBottom: 16, paddingTop: 16 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item: msg }) => {
                                const isMe = msg.senderId === '1';
                                const sender = members.find(m => m.id === msg.senderId);
                                const senderImg = sender?.profileImage;

                                return (
                                    <View style={{
                                        flexDirection: isMe ? 'row-reverse' : 'row',
                                        marginBottom: 16,
                                        alignItems: 'flex-end'
                                    }}>
                                        {!isMe && (
                                            <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: sender?.avatarColor || '#CBD5E1', marginRight: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {senderImg ? (
                                                    <Image source={{ uri: senderImg }} style={{ width: '100%', height: '100%' }} />
                                                ) : (
                                                    <Text style={{ fontSize: 14 }}>😊</Text>
                                                )}
                                            </View>
                                        )}
                                        <View style={{
                                            backgroundColor: isMe ? '#2563EB' : '#FFF',
                                            padding: 12,
                                            borderRadius: 16,
                                            borderBottomRightRadius: isMe ? 4 : 16,
                                            borderBottomLeftRadius: !isMe ? 4 : 16,
                                            maxWidth: '75%',
                                            shadowColor: '#000',
                                            shadowOpacity: 0.05,
                                            shadowRadius: 2,
                                            elevation: 1
                                        }}>
                                            {!isMe && <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748B', marginBottom: 4 }}>{sender?.name}</Text>}
                                            {msg.type === 'routine' ? (
                                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : '#F1F5F9', padding: 12, borderRadius: 12, gap: 12 }}>
                                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isMe ? '#FFF' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Dumbbell size={20} color={isMe ? '#2563EB' : '#64748B'} />
                                                    </View>
                                                    <View>
                                                        <Text style={{ color: isMe ? '#FFF' : '#1E293B', fontWeight: 'bold', fontSize: 14 }}>{msg.routineName}</Text>
                                                        <Text style={{ color: isMe ? '#BFDBFE' : '#64748B', fontSize: 10 }}>{t('sharedRoutine')}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ) : msg.type === 'exercise' ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : '#F1F5F9', padding: 12, borderRadius: 12, gap: 12 }}>
                                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isMe ? '#FFF' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Zap size={20} color={isMe ? '#2563EB' : '#64748B'} />
                                                    </View>
                                                    <View>
                                                        <Text style={{ color: isMe ? '#FFF' : '#1E293B', fontWeight: 'bold', fontSize: 14 }}>{msg.exerciseName}</Text>
                                                        <Text style={{ color: isMe ? '#BFDBFE' : '#64748B', fontSize: 10 }}>{msg.sets} {t('sets').toLowerCase()} • {msg.reps} {t('reps').toLowerCase()}</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text style={{ color: isMe ? '#FFF' : '#334155', fontSize: 14 }}>{msg.text}</Text>
                                            )}
                                            <Text style={{ fontSize: 10, color: isMe ? '#BFDBFE' : '#94A3B8', marginTop: 4, alignSelf: 'flex-end' }}>{msg.timestamp}</Text>
                                        </View>
                                    </View>
                                );
                            }}
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                            <TouchableOpacity
                                onPress={handleAddPress}
                                style={{
                                    width: 44, height: 44,
                                    borderRadius: 22,
                                    backgroundColor: '#F1F5F9',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 8
                                }}
                            >
                                <Plus size={20} color="#64748B" />
                            </TouchableOpacity>

                            <TextInput
                                value={message}
                                onChangeText={setMessage}
                                placeholder={t('typeMessage')}
                                placeholderTextColor="#94A3B8"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FFF',
                                    padding: 12,
                                    borderRadius: 24,
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0',
                                    marginRight: 8,
                                    fontSize: 14
                                }}
                            />
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: message.trim() ? '#2563EB' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
                                disabled={!message.trim()}
                            >
                                <Send size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                )}

            </View>

            <SelectRoutineModal
                visible={routineModalVisible}
                onClose={() => setRoutineModalVisible(false)}
                onRoutineSelected={handleSelectRoutine}
            />

            <ExerciseSearchModal
                visible={exerciseModalVisible}
                onClose={() => setExerciseModalVisible(false)}
                onSelect={handleSelectExercise}
                addedExercises={[]} // Not using this for single selection
                onRemove={() => { }} // Not needed
            />

            {/* Edit Squad Modal */}
            <Modal
                transparent={true}
                visible={editModalVisible}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>{t('editSquad')}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <View
                                    style={{
                                        width: 100, height: 100,
                                        borderRadius: 30,
                                        backgroundColor: '#F1F5F9',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                        overflow: 'hidden',
                                        marginBottom: 8
                                    }}
                                >
                                    {tempSquadImage ? (
                                        <Image source={{ uri: tempSquadImage }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <TextInput
                                            value={tempSquadIcon}
                                            onChangeText={setTempSquadIcon}
                                            placeholder="😊"
                                            maxLength={2}
                                            style={{
                                                fontSize: 48,
                                                textAlign: 'center',
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={handleImageSelection}
                                    style={{
                                        position: 'absolute',
                                        bottom: 4,
                                        right: -4,
                                        backgroundColor: '#2563EB',
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 2,
                                        borderColor: '#FFF',
                                        shadowColor: '#000',
                                        shadowOpacity: 0.15,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowRadius: 4,
                                        elevation: 4
                                    }}
                                >
                                    <Camera size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>{t('chooseOption').toUpperCase()}</Text>
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('squadName')}</Text>
                            <TextInput
                                value={tempSquadName}
                                onChangeText={setTempSquadName}
                                placeholder="Enter squad name"
                                style={{
                                    backgroundColor: '#F8FAFC',
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 16,
                                    color: '#0F172A',
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0'
                                }}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveSquad}
                            style={{
                                backgroundColor: '#2563EB',
                                paddingVertical: 16,
                                borderRadius: 16,
                                alignItems: 'center',
                                shadowColor: '#2563EB',
                                shadowOpacity: 0.3,
                                shadowOffset: { width: 0, height: 4 },
                                shadowRadius: 10,
                                elevation: 4
                            }}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
    );
}
