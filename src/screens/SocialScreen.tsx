import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Modal, TextInput as RNTextInput } from 'react-native';
import { createGroup, joinGroup } from '../services/groupService';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { UserPlus, Plus, Search, Users, Flame, ChevronRight, Activity } from 'lucide-react-native';
import { useSquads } from '../context/SquadContext';
import { useLanguage } from '../context/LanguageContext';

export default function SocialScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { squads, refreshSquads } = useSquads(); // Added refreshSquads
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'Squads' | 'Friends'>('Squads');
    const [searchQuery, setSearchQuery] = useState('');

    // Create Group State
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    const filteredSquads = squads.filter(squad =>
        squad.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            Alert.alert('Error', 'Group name is required');
            return;
        }
        try {
            await createGroup(newGroupName, newGroupDesc);
            setIsCreatingGroup(false);
            setNewGroupName('');
            setNewGroupDesc('');
            await refreshSquads();
            Alert.alert('Success', 'Group created successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to create group');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={{ width: 28, height: 28, marginRight: 12, borderRadius: 4 }}
                    />
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>{t('social')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <UserPlus size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsCreatingGroup(true)}
                        style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Plus size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {/* Tabs */}
                <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4, borderRadius: 16, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Squads')}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'Squads' ? '#FFF' : 'transparent',
                            borderRadius: 12,
                            shadowColor: activeTab === 'Squads' ? '#000' : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: activeTab === 'Squads' ? 2 : 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        <Users size={18} color={activeTab === 'Squads' ? '#2563EB' : '#64748B'} />
                        <Text style={{ fontWeight: 'bold', color: activeTab === 'Squads' ? '#2563EB' : '#64748B', fontSize: 13, letterSpacing: 0.5 }}>{t('squads').toUpperCase()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Friends')}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'Friends' ? '#FFF' : 'transparent',
                            borderRadius: 12,
                            shadowColor: activeTab === 'Friends' ? '#000' : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: activeTab === 'Friends' ? 2 : 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        <Activity size={18} color={activeTab === 'Friends' ? '#2563EB' : '#64748B'} />
                        <Text style={{ fontWeight: 'bold', color: activeTab === 'Friends' ? '#2563EB' : '#64748B', fontSize: 13, letterSpacing: 0.5 }}>{t('friends').toUpperCase()}</Text>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', position: 'absolute', top: 10, right: 30 }} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    height: 52,
                    marginBottom: 24
                }}>
                    <Search size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                    <TextInput
                        placeholder={t('findSquad')}
                        placeholderTextColor="#94A3B8"
                        style={{ flex: 1, fontSize: 16, color: colors.text }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Squad List */}
                {activeTab === 'Squads' && (
                    <View style={{ gap: 16 }}>
                        {filteredSquads.length > 0 ? filteredSquads.map((squad) => (
                            <TouchableOpacity
                                key={squad.id}
                                onPress={() => navigation.navigate('SquadDetail', { squadId: squad.id })}
                                style={{
                                    backgroundColor: '#FFF',
                                    borderRadius: 24,
                                    padding: 20,
                                    borderWidth: 1,
                                    borderColor: '#F1F5F9',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 12,
                                    elevation: 2
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: squad.color || '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 16, overflow: 'hidden' }}>
                                            {squad.image ? (
                                                <Image source={{ uri: squad.image }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <Text style={{ fontSize: 24 }}>{squad.icon || '👥'}</Text>
                                            )}
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 }}>{squad.name}</Text>
                                            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: 'bold' }}>
                                                {squad.members} {t('members').toUpperCase()}  <Text style={{ color: '#E2E8F0' }}>•</Text>  <Text style={{ color: '#10B981' }}>{squad.loggedToday} {t('loggedToday').toUpperCase()}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                    {squad.streak > 0 && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFEDD5' }}>
                                            <Flame size={14} color="#F97316" fill="#F97316" style={{ marginRight: 4 }} />
                                            <Text style={{ color: '#F97316', fontWeight: 'bold', fontSize: 12 }}>{squad.streak}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', paddingLeft: 10 }}>
                                        {[...Array(Math.min(3, squad.members))].map((_, idx) => (
                                            <View
                                                key={idx}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 16,
                                                    backgroundColor: idx === 0 ? '#FCA5A5' : idx === 1 ? '#93C5FD' : '#FCD34D',
                                                    marginLeft: -10,
                                                    borderWidth: 2,
                                                    borderColor: '#FFF'
                                                }}
                                            />
                                        ))}
                                        {squad.loggedToday > 0 && (
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF', position: 'absolute', bottom: 0, right: -2, zIndex: 10 }} />
                                        )}
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5, marginRight: 4 }}>{t('details').toUpperCase()}</Text>
                                        <ChevronRight size={14} color="#2563EB" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )) : (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ color: '#94A3B8', fontSize: 16 }}>{t('noSquadsFound')} "{searchQuery}"</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Create Group Modal */}
            <Modal
                visible={isCreatingGroup}
                transparent
                animationType="slide"
                onRequestClose={() => setIsCreatingGroup(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#FFF', width: '90%', borderRadius: 24, padding: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#0F172A' }}>Create New Squad</Text>

                        <RNTextInput
                            placeholder="Squad Name"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                            style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 }}
                        />

                        <RNTextInput
                            placeholder="Description"
                            value={newGroupDesc}
                            onChangeText={setNewGroupDesc}
                            multiline
                            numberOfLines={3}
                            style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, marginBottom: 24, fontSize: 16, height: 80, textAlignVertical: 'top' }}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setIsCreatingGroup(false)}
                                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' }}
                            >
                                <Text style={{ fontWeight: 'bold', color: '#64748B' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateGroup}
                                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center' }}
                            >
                                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Create Squad</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
