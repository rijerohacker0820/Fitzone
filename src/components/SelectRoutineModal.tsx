import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { WorkoutRoutine } from '../types';
import { getRoutines } from '../services/storage';
import { X, ChevronRight, Dumbbell } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onRoutineSelected: (routine: WorkoutRoutine) => void;
}

export default function SelectRoutineModal({ visible, onClose, onRoutineSelected }: Props) {
    const { colors } = useTheme();
    const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);

    useEffect(() => {
        if (visible) {
            loadRoutines();
        }
    }, [visible]);

    const loadRoutines = async () => {
        const data = await getRoutines();
        setRoutines(data);
    };

    const renderRoutine = ({ item }: { item: WorkoutRoutine }) => (
        <TouchableOpacity
            onPress={() => onRoutineSelected(item)}
            style={{
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#E2E8F0'
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Dumbbell size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.exercises.length} Exercises</Text>
                </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 20 }}>
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Seleccionar Rutina</Text>
                    <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                        <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                {routines.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No routines found. Create one in the Routines tab first!</Text>
                    </View>
                ) : (
                    <FlatList
                        data={routines}
                        renderItem={renderRoutine}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>
        </Modal>
    );
}
