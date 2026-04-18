import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Plus } from 'lucide-react-native';

interface Props {
    onLogPress?: () => void;
    onSchedulePress?: () => void;
};

export default function ActionButtons({ onLogPress, onSchedulePress }: Props) {
    const { colors } = useTheme();

    return (
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {/* View Schedule Button */}
            <TouchableOpacity
                onPress={onSchedulePress}
                style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    height: 100
                }}>
                <View style={{
                    width: 40, height: 40,
                    borderRadius: 20,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8
                }}>
                    <Calendar size={20} color={colors.textSecondary} />
                </View>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Ver Horario</Text>
            </TouchableOpacity>

            {/* Log Workout Button */}
            <TouchableOpacity
                onPress={onLogPress}
                style={{
                    flex: 1,
                    backgroundColor: colors.primary, // Bright blue
                    borderRadius: 20,
                    padding: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100
                }}>
                <View style={{
                    width: 40, height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8
                }}>
                    <Plus size={20} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 19, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>Registrar Entreno</Text>
            </TouchableOpacity>
        </View>
    );
}
