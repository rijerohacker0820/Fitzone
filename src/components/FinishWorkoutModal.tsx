import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { Zap, Smile, Coffee, Check, Trophy, Meh, Activity, BatteryWarning } from 'lucide-react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (sensation: 'Great' | 'Good' | 'Neutral' | 'Hard' | 'Exhausted', notes: string, imageUri?: string) => void;
}

import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';

export default function FinishWorkoutModal({ visible, onClose, onSave }: Props) {
    const { colors } = useTheme();
    const [sensation, setSensation] = useState<'Great' | 'Good' | 'Neutral' | 'Hard' | 'Exhausted'>('Good');
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState<string | undefined>(undefined);

    const handleSave = () => {
        onSave(sensation, notes, imageUri);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera permissions to take a photo.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const SensationButton = ({ type, icon: Icon, label }: { type: any, icon: any, label: string }) => (
        <TouchableOpacity
            onPress={() => setSensation(type)}
            style={[
                styles.sensationButton,
                { backgroundColor: sensation === type ? colors.primary : colors.background },
                sensation === type && styles.activeButton
            ]}
        >
            <Icon color={sensation === type ? colors.background : colors.textSecondary} size={28} />
            <Text style={[
                styles.sensationLabel,
                { color: sensation === type ? colors.background : colors.textSecondary }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%', alignItems: 'center' }}
                >
                    <View style={[styles.content, { backgroundColor: colors.card }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Finish Workout</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>How do you feel after this session?</Text>

                        <View style={styles.sensationContainer}>
                            <View style={styles.sensationRow}>
                                <SensationButton type="Great" icon={Trophy} label="Great" />
                                <SensationButton type="Good" icon={Smile} label="Good" />
                                <SensationButton type="Neutral" icon={Meh} label="Neutral" />
                                <SensationButton type="Hard" icon={Activity} label="Hard" />
                                <SensationButton type="Exhausted" icon={Coffee} label="Exhausted" />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (Optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#E2E8F0' }]}
                            placeholder="How did it go? Any pains or highlights?"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Add Photo (Optional)</Text>
                        {imageUri ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                <TouchableOpacity
                                    onPress={() => setImageUri(undefined)}
                                    style={styles.removeImageButton}
                                >
                                    <Trash2 size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.photoActions}>
                                <TouchableOpacity
                                    onPress={takePhoto}
                                    style={[styles.photoButton, { backgroundColor: colors.background, borderColor: '#E2E8F0' }]}
                                >
                                    <Camera size={24} color={colors.primary} />
                                    <Text style={[styles.photoButtonText, { color: colors.text }]}>Take Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={pickImage}
                                    style={[styles.photoButton, { backgroundColor: colors.background, borderColor: '#E2E8F0' }]}
                                >
                                    <ImageIcon size={24} color={colors.primary} />
                                    <Text style={[styles.photoButtonText, { color: colors.text }]}>Library</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            >
                                <Check color={colors.background} size={20} />
                                <Text style={[styles.saveButtonText, { color: colors.background }]}>Save Workout</Text>
                            </TouchableOpacity>
                        </View>
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
        alignItems: 'center',
        padding: 20
    },
    content: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32
    },
    sensationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32
    },
    sensationRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    sensationButton: {
        width: '30%',
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sensationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 6
    },
    activeButton: {
        borderColor: 'transparent'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4
    },
    input: {
        borderRadius: 16,
        padding: 16,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 20
    },
    photoActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    photoButton: {
        flex: 1,
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    photoButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 8,
        borderRadius: 10,
    },
    footer: {
        flexDirection: 'row',
        gap: 12
    },
    skipButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center'
    },
    saveButton: {
        flex: 2,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold'
    }
});
