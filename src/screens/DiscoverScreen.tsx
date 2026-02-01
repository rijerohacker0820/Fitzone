import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AvatarBuilder from '../components/AvatarBuilder';

export default function DiscoverScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={{ padding: 20, paddingTop: 60 }}>
                <Text style={{ color: colors.text, fontSize: 32, fontWeight: 'bold' }}>{t('discover')}</Text>
            </View>

            <AvatarBuilder />

            {/* Additional discover Content placeholders */}
            <View style={{ padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{t('magicSearch')}</Text>
                <View style={{ height: 100, backgroundColor: colors.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>{t('usingGemini')}</Text>
                </View>
            </View>
        </ScrollView>
    );
}
