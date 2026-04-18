import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Minus, Plus, X } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (sets: number, reps: number) => void;
    exerciseName: string;
    initialSets?: number;
    initialReps?: number;
    confirmButtonText?: string;
}

export default function SetRepSelectionModal({
    visible,
    onClose,
    onConfirm,
    exerciseName,
    initialSets = 3,
    initialReps = 10,
    confirmButtonText = "Agregar al Entrenamiento"
}: Props) {
    const { colors } = useTheme();
    const [sets, setSets] = useState(initialSets);
    const [reps, setReps] = useState(initialReps);

    // Update state if initial values change (e.g. when opening for a different exercise)
    React.useEffect(() => {
        if (visible) {
            setSets(initialSets);
            setReps(initialReps);
        }
    }, [visible, initialSets, initialReps]);

    const handleConfirm = () => {
        onConfirm(sets, reps);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                >
                    <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{exerciseName}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X color="#94A3B8" size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subtitle}>Establecer series y repeticiones iniciales</Text>

                        {/* Sets Selector */}
                        <View style={styles.selectorRow}>
                            <View style={styles.labelCol}>
                                <Text style={styles.label}>Series</Text>
                            </View>
                            <View style={styles.controlCol}>
                                <TouchableOpacity
                                    onPress={() => setSets(Math.max(1, sets - 1))}
                                    style={styles.stepBtn}
                                >
                                    <Minus size={20} color="#64748B" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.input}
                                    value={sets.toString()}
                                    onChangeText={(val) => setSets(parseInt(val) || 1)}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    onPress={() => setSets(sets + 1)}
                                    style={styles.stepBtn}
                                >
                                    <Plus size={20} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Reps Selector */}
                        <View style={styles.selectorRow}>
                            <View style={styles.labelCol}>
                                <Text style={styles.label}>Repeticiones</Text>
                            </View>
                            <View style={styles.controlCol}>
                                <TouchableOpacity
                                    onPress={() => setReps(Math.max(1, reps - 1))}
                                    style={styles.stepBtn}
                                >
                                    <Minus size={20} color="#64748B" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.input}
                                    value={reps.toString()}
                                    onChangeText={(val) => setReps(parseInt(val) || 1)}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    onPress={() => setReps(reps + 1)}
                                    style={styles.stepBtn}
                                >
                                    <Plus size={20} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmBtnText}>{confirmButtonText}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        flex: 1,
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
    },
    selectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    labelCol: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    controlCol: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 4,
    },
    stepBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        width: 60,
        height: 40,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    confirmBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
