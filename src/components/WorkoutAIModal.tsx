import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { generateWorkout } from '../services/gemini';
import { WorkoutRoutine } from '../types';
import { X, Sparkles } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onRoutineGenerated: (routine: WorkoutRoutine) => void;
}

export default function WorkoutAIModal({ visible, onClose, onRoutineGenerated }: Props) {
    const { colors } = useTheme();
    const [goal, setGoal] = useState('');
    const [equipment, setEquipment] = useState('None');
    const [level, setLevel] = useState('Beginner');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const routine = await generateWorkout(goal, equipment, level);
        setLoading(false);
        if (routine) {
            onRoutineGenerated(routine);
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Sparkles color={colors.primary} size={24} />
                            <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>AI Coach</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Goal</Text>
                    <TextInput
                        style={{ backgroundColor: colors.background, color: colors.text, padding: 16, borderRadius: 12, marginBottom: 16 }}
                        placeholder="e.g. Build chest size, Increase stamina"
                        placeholderTextColor={colors.textSecondary}
                        value={goal}
                        onChangeText={setGoal}
                    />

                    <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Equipment</Text>
                    <TextInput
                        style={{ backgroundColor: colors.background, color: colors.text, padding: 16, borderRadius: 12, marginBottom: 16 }}
                        value={equipment}
                        onChangeText={setEquipment}
                    />

                    <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Level</Text>
                    {/* Simple selector for level could go here, for now TextInput */}
                    <TextInput
                        style={{ backgroundColor: colors.background, color: colors.text, padding: 16, borderRadius: 12, marginBottom: 24 }}
                        value={level}
                        onChangeText={setLevel}
                    />

                    <TouchableOpacity
                        onPress={handleGenerate}
                        disabled={loading}
                        style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 16, alignItems: 'center' }}
                    >
                        {loading ? <ActivityIndicator color={colors.background} /> : (
                            <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 16 }}>Generate Routine</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
