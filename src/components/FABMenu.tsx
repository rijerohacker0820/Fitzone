import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, Dumbbell, History, Sparkles, Play } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onAdd: () => void;
    onBuild: () => void;
    onExisting?: () => void;
}

export default function FABMenu({ visible, onClose, onAdd, onBuild, onExisting }: Props) {
    const { colors } = useTheme();

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <View style={styles.container}>
                        {/* Build Option */}
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => {
                                onClose();
                                setTimeout(onBuild, 100);
                            }}
                        >
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Create Routine</Text>
                                <Text style={styles.subtitle}>CREATE NEW REUSABLE ROUTINE</Text>
                            </View>
                            <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                                <Dumbbell size={24} color="#4F46E5" />
                            </View>
                        </TouchableOpacity>

                        {/* Existing Option */}
                        {onExisting && (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => {
                                    onClose();
                                    setTimeout(onExisting, 100);
                                }}
                            >
                                <View style={styles.textContainer}>
                                    <Text style={styles.title}>Existing Routine</Text>
                                    <Text style={styles.subtitle}>START FROM SAVED</Text>
                                </View>
                                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                                    <Play size={24} color="#F59E0B" fill="#F59E0B" />
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Add Option */}
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => {
                                onClose();
                                setTimeout(onAdd, 100);
                            }}
                        >
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Log Workout</Text>
                                <Text style={styles.subtitle}>ONE-OFF QUICK SESSION</Text>
                            </View>
                            <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
                                <History size={24} color="#16A34A" />
                            </View>
                        </TouchableOpacity>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: '#94A3B8' }]}
                        >
                            <X color="#FFF" size={30} strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    container: {
        paddingRight: 20,
        paddingBottom: 30,
        alignItems: 'flex-end',
    },
    card: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        width: 300,
    },
    textContainer: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginTop: 10,
    }
});
