import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { WorkoutRoutine, WorkoutSet } from '../types';
import { RootStackParamList } from '../navigation/types';
import { ChevronLeft, Calendar, Clock, Zap, Smile, Coffee, Check, X, Minus, Trophy, Meh, Activity, BatteryWarning } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

type WorkoutSummaryRouteProp = RouteProp<RootStackParamList, 'WorkoutSummary'>;

export default function WorkoutSummaryScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const route = useRoute<WorkoutSummaryRouteProp>();
    const navigation = useNavigation();
    const { log } = route.params;

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getSensationIcon = (sensation?: string) => {
        switch (sensation) {
            case 'Great': return <Trophy color={colors.primary} size={24} />;
            case 'Good': return <Smile color="#3B82F6" size={24} />;
            case 'Neutral': return <Meh color={colors.textSecondary} size={24} />;
            case 'Hard': return <Activity color="#F59E0B" size={24} />;
            case 'Exhausted': return <Coffee color="#EF4444" size={24} />;
            // Legacy fallbacks
            case 'Energized': return <Zap color={colors.primary} size={24} />;
            case 'Tired': return <Coffee color={colors.textSecondary} size={24} />;
            default: return <Smile color={colors.textSecondary} size={24} />;
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header with Back Button */}
            <View style={{ paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
                    <ChevronLeft color={colors.text} size={32} />
                </TouchableOpacity>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>{log.name}</Text>
            </View>

            {/* Stats Card */}
            <View style={{ marginHorizontal: 20, backgroundColor: colors.card, padding: 20, borderRadius: 20, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Calendar color={colors.textSecondary} size={20} style={{ marginRight: 8 }} />
                        <Text style={{ color: colors.text, fontSize: 16 }}>{new Date(log.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock color={colors.textSecondary} size={20} style={{ marginRight: 8 }} />
                        <Text style={{ color: colors.text, fontSize: 16 }}>{formatDuration(log.duration)}</Text>
                    </View>
                </View>

                {/* Sensation & Notes */}
                {(log.sensation || log.notes) && (
                    <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20 }}>
                        {log.sensation && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: log.notes ? 12 : 0 }}>
                                <View style={{ marginRight: 10 }}>{getSensationIcon(log.sensation)}</View>
                                <Text style={{ color: colors.text, fontWeight: 'bold' }}>{t('felt')} {log.sensation}</Text>
                            </View>
                        )}
                        {log.notes && (
                            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>"{log.notes}"</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Photo */}
            {log.imageUri && (
                <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>{t('photo')}</Text>
                    <Image source={{ uri: log.imageUri }} style={{ width: '100%', height: 300, borderRadius: 20, backgroundColor: '#E2E8F0' }} resizeMode="cover" />
                </View>
            )}


            {/* Exercises List */}
            <View style={{ paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>{t('workoutSummary')}</Text>
                {log.exercises.map((ex, idx) => (
                    <View key={idx} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>{ex.name}</Text>
                        {ex.sets.map((set: WorkoutSet, sIdx) => (
                            <View key={sIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 24, height: 24, borderRadius: 12,
                                        backgroundColor: set.status === 'completed' ? '#DCFCE7' : set.status === 'failed' ? '#FEE2E2' : '#FEF3C7',
                                        alignItems: 'center', justifyContent: 'center', marginRight: 12
                                    }}>
                                        {set.status === 'completed' ? <Check size={14} color="#16A34A" /> :
                                            set.status === 'failed' ? <X size={14} color="#DC2626" /> :
                                                <Minus size={14} color="#D97706" />}
                                    </View>
                                    <Text style={{ color: colors.textSecondary }}>{t('set')} {sIdx + 1}</Text>
                                </View>
                                <Text style={{ color: colors.text, fontWeight: '600' }}>
                                    {set.reps} {t('reps').toLowerCase()} × {set.weight}kg
                                </Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
