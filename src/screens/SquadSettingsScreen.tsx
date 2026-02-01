import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Camera, User, LogOut, Trash2, Shield, Bell } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSquads } from '../context/SquadContext';
import { RootStackParamList } from '../navigation/types';

type SquadSettingsNavProp = NativeStackNavigationProp<RootStackParamList, 'SquadSettings'>;
type SquadSettingsRouteProp = RouteProp<RootStackParamList, 'SquadSettings'>;

interface SquadMember {
    id: string;
    name: string;
    avatarColor: string;
    role: 'Admin' | 'Member';
    isCurrentUser?: boolean;
    profileImage?: string;
}

import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

export default function SquadSettingsScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation<SquadSettingsNavProp>();
    const route = useRoute<SquadSettingsRouteProp>();
    const { squadId } = route.params;
    const { getSquad, updateSquad } = useSquads();
    const { user } = useUser();
    const squad = getSquad(squadId);

    // Local State for editing
    const [name, setName] = useState(squad?.name || '');
    const [icon, setIcon] = useState(squad?.icon || '👥');
    const [image, setImage] = useState<string | null>(squad?.image || null);
    const [isPublic, setIsPublic] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Sync with context if it changes from outside (unlikely while focused here but good practice)
    useEffect(() => {
        if (squad) {
            setName(squad.name);
            setIcon(squad.icon || '👥');
            setImage(squad.image);
        }
    }, [squad]);

    // Generate Mock Members
    const members = React.useMemo(() => {
        const count = squad?.members || 3;
        const currentUserMember: SquadMember = {
            id: 'current-user',
            name: user.name,
            avatarColor: '#FCA5A5',
            role: 'Admin',
            isCurrentUser: true,
            profileImage: user.profileImage || undefined
        };

        const baseMembers: SquadMember[] = [
            currentUserMember,
            { id: '2', name: 'Sarah', avatarColor: '#93C5FD', role: 'Member' },
            { id: '3', name: 'Mike', avatarColor: '#FCD34D', role: 'Member' }
        ];

        if (count <= 3) return baseMembers.slice(0, count);

        const extraMembers: SquadMember[] = [];
        const colors = ['#FCA5A5', '#93C5FD', '#FCD34D', '#86EFAC', '#C4B5FD', '#FDBA74'];

        for (let i = 4; i <= count; i++) {
            extraMembers.push({
                id: i.toString(),
                name: `Member ${i}`,
                avatarColor: colors[i % colors.length],
                role: 'Member'
            });
        }

        return [...baseMembers, ...extraMembers];
    }, [squad?.members]);


    const handleSave = () => {
        updateSquad(squadId, {
            name,
            icon,
            image
        });
        navigation.goBack();
    };

    const handleLeaveSquad = () => {
        Alert.alert(
            t('leaveSquad'),
            t('leaveSquadMsg'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('leave'),
                    style: "destructive",
                    onPress: () => {
                        // In a real app, this would call an API
                        navigation.navigate('MainTabs');
                    }
                }
            ]
        );
    };

    const handleImageSelection = () => {
        Alert.alert(
            t('squadPhoto'),
            t('chooseOption'),
            [
                { text: t('camera'), onPress: takePhoto },
                { text: t('gallery'), onPress: pickImage },
                { text: t('removePhoto'), style: "destructive", onPress: () => setImage(null) },
                { text: t('cancel'), style: "cancel" }
            ]
        );
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert(t('permissionRequired'), t('cameraRollPermissionMsg'));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImage(result.assets[0].uri);
            }
        } catch (error: any) {
            Alert.alert(t('error'), t('errorPickImage'));
        }
    };

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert(t('permissionRequired'), t('cameraPermissionMsg'));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImage(result.assets[0].uri);
            }
        } catch (error: any) {
            Alert.alert(t('error'), t('errorTakePhoto'));
        }
    };

    if (!squad) return null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{t('squadSettings')}</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 16 }}>{t('save')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Visual Identity Section */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <TouchableOpacity onPress={handleImageSelection} style={{ position: 'relative' }}>
                        <View style={{
                            width: 100, height: 100, borderRadius: 30,
                            backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0'
                        }}>
                            {image ? (
                                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <TextInput
                                    value={icon}
                                    onChangeText={setIcon}
                                    placeholder="😊"
                                    maxLength={2}
                                    style={{ fontSize: 48, textAlign: 'center', width: '100%', height: '100%' }}
                                />
                            )}
                        </View>
                        <View style={{
                            position: 'absolute', bottom: -4, right: -4,
                            backgroundColor: '#2563EB', width: 32, height: 32, borderRadius: 16,
                            alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF'
                        }}>
                            <Camera size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 12, color: '#64748B', fontSize: 12, fontWeight: 'bold' }}>{t('tapToEditIcon')}</Text>
                </View>

                {/* General Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('general').toUpperCase()}</Text>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('squadName')}</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={styles.input}
                                placeholder={t('squadName')}
                            />
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.row}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Shield size={20} color="#64748B" style={{ marginRight: 12 }} />
                                <Text style={styles.rowText}>{t('publicSquad')}</Text>
                            </View>
                            <Switch
                                value={isPublic}
                                onValueChange={setIsPublic}
                                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                                thumbColor={isPublic ? '#2563EB' : '#F1F5F9'}
                            />
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.row}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Bell size={20} color="#64748B" style={{ marginRight: 12 }} />
                                <Text style={styles.rowText}>{t('notifications')}</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                                thumbColor={notificationsEnabled ? '#2563EB' : '#F1F5F9'}
                            />
                        </View>
                    </View>
                </View>

                {/* Participants */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('participants').toUpperCase()} ({members.length})</Text>
                    <View style={styles.card}>
                        {members.map((member, index) => (
                            <View key={member.id}>
                                <View style={styles.memberRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{
                                            width: 40, height: 40, borderRadius: 20,
                                            backgroundColor: member.avatarColor, alignItems: 'center', justifyContent: 'center',
                                            marginRight: 12, overflow: 'hidden'
                                        }}>
                                            {member.profileImage ? (
                                                <Image source={{ uri: member.profileImage }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <Text style={{ fontSize: 16 }}>😊</Text>
                                            )}
                                        </View>
                                        <View>
                                            <Text style={styles.memberName}>{member.name} {member.isCurrentUser && t('you')}</Text>
                                            <Text style={styles.memberRole}>{member.role}</Text>
                                        </View>
                                    </View>
                                    {member.isCurrentUser ? (
                                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>{t('owner')}</Text>
                                    ) : (
                                        <TouchableOpacity>
                                            <Trash2 size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {index < members.length - 1 && <View style={styles.separator} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={handleLeaveSquad} style={[styles.card, { alignItems: 'center', paddingVertical: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>{t('leaveSquad')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    inputContainer: { padding: 16 },
    label: { fontSize: 12, color: '#64748B', fontWeight: 'bold', marginBottom: 4 },
    input: { fontSize: 16, color: '#0F172A', fontWeight: '600' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    rowText: { fontSize: 16, color: '#0F172A', fontWeight: '500' },
    memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
    memberName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
    memberRole: { fontSize: 12, color: '#64748B' },
    separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 16 }
});
