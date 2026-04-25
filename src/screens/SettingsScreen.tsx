import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { ChevronLeft, Save, User, Ruler, Weight, Globe, Moon, Target } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileTheme, Language } from '../types';
import { useToast } from '../components/Toast';

export default function SettingsScreen() {
    const { colors } = useTheme();
    const { t, setLanguage } = useLanguage();
    const { user, updateProfile } = useUser();
    const navigation = useNavigation();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [height, setHeight] = useState(user?.height?.toString() || '');
    const [weight, setWeight] = useState(user?.weight?.toString() || '');
    const [weeklyGoal, setWeeklyGoal] = useState(user?.weeklyWorkoutGoal?.toString() || '4');
    const [selectedTheme, setSelectedTheme] = useState<ProfileTheme>(user?.theme || 'Clean Blue');
    const [selectedLang, setSelectedLang] = useState<Language>(user?.language || 'en');

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateProfile({
                name,
                bio,
                height: parseFloat(height) || 0,
                weight: parseFloat(weight) || 0,
                weeklyWorkoutGoal: parseInt(weeklyGoal) || 4,
                theme: selectedTheme,
                language: selectedLang
            });
            // Also update global language context
            setLanguage(selectedLang);

            showToast(t('profileUpdated'), 'success');
            navigation.goBack();
        } catch (error) {
            showToast(t('failedUpdateProfile'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const themes: ProfileTheme[] = ['Clean Blue', 'Electric Blue', 'Lush Green', 'Crimson Pulse', 'Golden Hour', 'Royal Purple', 'Obsidian'];
    const languages: { code: Language; label: string }[] = [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' }
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: '#E2E8F0' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('appSettings')}</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Save size={24} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Profile Section */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('personalDetails')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <User size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('name')}</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: '#E2E8F0', backgroundColor: colors.background }]}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('yourName')}
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary, marginLeft: 24, marginBottom: 8 }]}>{t('bio')}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: '#E2E8F0', backgroundColor: colors.background, height: 80, textAlignVertical: 'top' }]}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            placeholder={t('tellAboutYourself')}
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                </View>

                {/* Body Stats */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('stats')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card, flexDirection: 'row', gap: 12 }]}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ruler size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('height')} (cm)</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: '#E2E8F0', backgroundColor: colors.background }]}
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Weight size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('weight')} (kg)</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: '#E2E8F0', backgroundColor: colors.background }]}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Goals */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('goals')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Target size={16} color={colors.primary} style={{ marginRight: 8 }} />
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('weeklyGoal')} ({t('daysWeekLabel')})</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                            <TouchableOpacity
                                key={num}
                                onPress={() => setWeeklyGoal(num.toString())}
                                style={{
                                    width: 40, height: 40,
                                    borderRadius: 20,
                                    backgroundColor: parseInt(weeklyGoal) === num ? colors.primary : colors.background,
                                    justifyContent: 'center', alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: parseInt(weeklyGoal) === num ? colors.primary : '#E2E8F0'
                                }}
                            >
                                <Text style={{ color: parseInt(weeklyGoal) === num ? '#FFF' : colors.text, fontWeight: 'bold' }}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Preferences */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('preferences')}</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Globe size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('language')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {languages.map(lang => (
                                <TouchableOpacity
                                    key={lang.code}
                                    onPress={() => setSelectedLang(lang.code)}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 8,
                                        borderRadius: 8,
                                        backgroundColor: selectedLang === lang.code ? colors.primary : colors.background,
                                        borderWidth: 1,
                                        borderColor: selectedLang === lang.code ? colors.primary : '#E2E8F0'
                                    }}
                                >
                                    <Text style={{ color: selectedLang === lang.code ? '#FFF' : colors.text }}>{lang.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Moon size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('theme')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {themes.map(themeName => (
                                <TouchableOpacity
                                    key={themeName}
                                    onPress={() => setSelectedTheme(themeName)}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 6,
                                        borderRadius: 8,
                                        backgroundColor: selectedTheme === themeName ? colors.primary : colors.background,
                                        borderWidth: 1,
                                        borderColor: selectedTheme === themeName ? colors.primary : '#E2E8F0',
                                        marginBottom: 4
                                    }}
                                >
                                    <Text style={{ color: selectedTheme === themeName ? '#FFF' : colors.text, fontSize: 12 }}>{themeName}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Space at bottom */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 16,
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
});
