import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Flame } from 'lucide-react-native';
import { SquadMember } from '../context/SquadContext';

interface Props {
    squadName?: string;
    streak?: number;
    onPress?: () => void;
    isActive?: boolean;
    members?: SquadMember[];
}

export default function StreakCard({ squadName, streak = 0, onPress, isActive = false, members = [] }: Props) {
    const { colors } = useTheme();
    const { t } = useLanguage();

    // Prioritize members who completed the streak, then others. Limit to 3.
    const displayMembers = React.useMemo(() => {
        const sorted = [...members].sort((a, b) => {
            if (a.hasCompletedStreak === b.hasCompletedStreak) return 0;
            return a.hasCompletedStreak ? -1 : 1;
        });
        return sorted.slice(0, 3);
    }, [members]);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9} // Slight fade feedback
            style={{
                backgroundColor: colors.card, // Using card color (white)
                borderRadius: 24,
                padding: 20,
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? colors.primary : '#E2E8F0',
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Flame size={20} color={colors.primary} fill={colors.primary} />
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                            {squadName || 'Iron Squad'} {t('streakStr')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>{streak}</Text>
                        <Text style={{ fontSize: 16, color: colors.textSecondary, marginLeft: 6 }}>{streak === 1 ? t('dayUnit').toLowerCase() : t('daysUnit').toLowerCase()}</Text>
                    </View>
                    <Text style={{ color: colors.primary, fontSize: 14, marginTop: 4 }}>
                        {streak > 0 ? t('keepChainAlive') : t('startWorkoutStreak')}
                    </Text>
                </View>

                {/* Avatar Pile */}
                <View style={{ flexDirection: 'row-reverse' }}>
                    {displayMembers.map((member, i) => (
                        <View key={member.id} style={{
                            width: 32, height: 32,
                            borderRadius: 16,
                            backgroundColor: '#CBD5E1',
                            borderWidth: 2,
                            borderColor: colors.card,
                            marginLeft: -10,
                            justifyContent: 'center', alignItems: 'center',
                            overflow: 'hidden'
                        }}>
                            {member.profileImage ? (
                                <Image source={{ uri: member.profileImage }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B' }}>
                                    {member.name.charAt(0)}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );
}
