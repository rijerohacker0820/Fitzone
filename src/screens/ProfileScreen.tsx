import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Image, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { clearAllData } from '../services/storage';
import { customAlert } from '../utils/alert';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Settings, User, Bell, Shield, Info, Trash2, Cpu, Camera, Edit2, Activity, Clock, Award, ChevronRight, Target, X, Globe } from 'lucide-react-native';

export default function ProfileScreen() {
    const { colors } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const { user, updateProfile, logout } = useUser();
    const navigation = useNavigation<any>();

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Activity size={32} color={colors.primary} />
            </View>
        );
    }

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(user.name);
    const [tempBio, setTempBio] = useState(user.bio);
    const [showGoalPicker, setShowGoalPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);

    const handleSaveProfile = () => {
        updateProfile({ name: tempName, bio: tempBio });
        setIsEditing(false);
    };

    const handleImageSelection = () => {
        Alert.alert(
            "Profile Photo",
            "Change your profile photo",
            [
                { text: "Camera", onPress: takePhoto },
                { text: "Gallery", onPress: pickImage },
                { text: "Remove Photo", style: "destructive", onPress: () => updateProfile({ profileImage: null }) },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Camera roll access is needed to select a photo.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                updateProfile({ profileImage: result.assets[0].uri });
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to pick image: " + error.message);
        }
    };

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Camera access is needed to take a photo.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                updateProfile({ profileImage: result.assets[0].uri });
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to take photo: " + error.message);
        }
    };


    const handleReset = () => {
        customAlert(
            "Developer Reset",
            "This will clear ALL workout history, routines, and profile data. Proceed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset Everything",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        customAlert("Success", "All data cleared. Please restart the app for changes to take effect.");
                    }
                }
            ]
        );
    };

    const handleGoalPress = () => {
        if (!user.lastGoalChange) {
            setShowGoalPicker(true);
            return;
        }

        const lastDate = new Date(user.lastGoalChange);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysRemaining = 30 - diffDays;

        if (daysRemaining > 0) {
            Alert.alert(
                "Goal Locked",
                `To ensure consistency, you can only change your goal once every 30 days.\n\nNext update available in ${daysRemaining} days.`
            );
        } else {
            setShowGoalPicker(true);
        }
    };

    const updateGoal = (days: number) => {
        updateProfile({
            weeklyWorkoutGoal: days,
            lastGoalChange: new Date().toISOString()
        });
        setShowGoalPicker(false);
        Alert.alert("Goal Updated", `Your new target is ${days} workouts per week. Go crush it!`);
    };

    const StatCard = ({ icon: Icon, value, label, color }: { icon: any, value: string, label: string, color: string }) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, shadowColor: '#000' }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Icon size={20} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );

    const SettingItem = ({ icon: Icon, label, value, color, onPress }: { icon: any, label: string, value?: string, color?: string, onPress?: () => void }) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.background }]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconContainer, { backgroundColor: (color || colors.primary) + '15' }]}>
                    <Icon size={20} color={color || colors.primary} />
                </View>
                <View>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {value && <Text style={{ color: colors.textSecondary, marginRight: 8, fontSize: 13, fontWeight: '500' }}>{value}</Text>}
                <ChevronRight size={16} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header Profile Section */}
                <View style={[styles.header, { backgroundColor: colors.card }]}>
                    <View style={{ position: 'relative' }}>
                        <TouchableOpacity onPress={handleImageSelection}>
                            <View style={[styles.avatarContainer, { borderColor: colors.background }]}>
                                {user.profileImage ? (
                                    <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <User color="#FFF" size={40} />
                                    </View>
                                )}
                            </View>
                            <View style={styles.cameraButton}>
                                <Camera size={14} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {isEditing ? (
                        <View style={{ width: '80%', alignItems: 'center', marginTop: 12 }}>
                            <TextInput
                                value={tempName}
                                onChangeText={setTempName}
                                style={[styles.input, { color: colors.text, borderColor: colors.textSecondary + '40' }]}
                                placeholder="Name"
                            />
                            <TextInput
                                value={tempBio}
                                onChangeText={setTempBio}
                                style={[styles.input, { color: colors.textSecondary, fontSize: 14, height: 40, borderColor: colors.textSecondary + '40' }]}
                                placeholder="Bio"
                                multiline
                            />
                            <TouchableOpacity onPress={handleSaveProfile} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>{t('saveProfile')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 12, width: '80%' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
                                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ marginLeft: 8, padding: 4 }}>
                                    <Edit2 size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.bio, { color: colors.textSecondary }]}>{user.bio}</Text>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <StatCard
                        icon={Activity}
                        value={user.stats.workoutsCompleted.toString()}
                        label={t('workouts')}
                        color="#3B82F6"
                    />
                    <StatCard
                        icon={Clock}
                        value={`${Math.floor(user.stats.minutesTrained / 60)}h`}
                        label={t('time')}
                        color="#F59E0B"
                    />
                    <StatCard
                        icon={Award}
                        value={`${user.stats.streakDays} Day`}
                        label={t('streak')}
                        color="#EF4444"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('goals')}</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                        <TouchableOpacity
                            style={[styles.settingItem, { borderBottomColor: colors.background }]}
                            onPress={handleGoalPress}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.iconContainer, { backgroundColor: '#10B98115' }]}>
                                    <Target size={20} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>{t('weeklyGoal')}</Text>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('goalSubtitle')}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: colors.primary, marginRight: 8, fontSize: 16, fontWeight: 'bold' }}>
                                    {user.weeklyWorkoutGoal || 4} Days/Week
                                </Text>
                                <ChevronRight size={16} color={colors.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account')}</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                        <SettingItem icon={User} label={t('personalDetails')} value={user.email} />
                        <SettingItem icon={Bell} label={t('notifications')} value="On" />
                        <SettingItem icon={Shield} label={t('privacy')} />
                        <SettingItem
                            icon={Globe}
                            label={t('language')}
                            value={language === 'en' ? 'English' : language === 'es' ? 'Español' : 'Français'}
                            onPress={() => setShowLanguagePicker(true)}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('support')}</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                        <SettingItem icon={Info} label={t('helpFeedback')} />
                        <SettingItem
                            icon={Settings}
                            label={t('appSettings')}
                            onPress={() => navigation.navigate('Settings')}
                        />
                    </View>
                </View>

                {/* Developer Tools */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>{t('developerZone')}</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                        <TouchableOpacity
                            onPress={handleReset}
                            style={styles.settingItem}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.iconContainer, { backgroundColor: '#EF444415' }]}>
                                    <Cpu size={20} color="#EF4444" />
                                </View>
                                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>{t('resetAppData')}</Text>
                            </View>
                            <Trash2 size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>{t('logOut')}</Text>
                </TouchableOpacity>

                <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.2.0 (Build 45)</Text>

                {/* Modal for Goal Selection */}
                <Modal
                    visible={showGoalPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowGoalPicker(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: colors.card, width: '80%', maxHeight: 400, borderRadius: 24, padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{t('setWeeklyGoal')}</Text>
                                <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                                {t('goalPrompt')}
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        onPress={() => updateGoal(num)}
                                        style={{
                                            width: 60, height: 60,
                                            borderRadius: 30,
                                            backgroundColor: user.weeklyWorkoutGoal === num ? colors.primary : colors.background,
                                            justifyContent: 'center', alignItems: 'center',
                                            borderWidth: 2,
                                            borderColor: user.weeklyWorkoutGoal === num ? colors.primary : '#E2E8F0'
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 24,
                                            fontWeight: 'bold',
                                            color: user.weeklyWorkoutGoal === num ? '#FFF' : colors.text
                                        }}>
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Modal for Language Selection */}
                <Modal
                    visible={showLanguagePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowLanguagePicker(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: colors.card, width: '80%', borderRadius: 24, padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Select Language</Text>
                                <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {[
                                { code: 'en', label: 'English', icon: '🇺🇸' },
                                { code: 'es', label: 'Español', icon: '🇪🇸' },
                                { code: 'fr', label: 'Français', icon: '🇫🇷' }
                            ].map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    onPress={() => {
                                        setLanguage(lang.code as any);
                                        setShowLanguagePicker(false);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.background
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.icon}</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{lang.label}</Text>
                                    </View>
                                    {language === lang.code && <Award size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingTop: 60,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bio: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        fontSize: 16,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    sectionContent: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 32,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: 'bold',
    },
    version: {
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 40,
        fontSize: 12,
    }
});
