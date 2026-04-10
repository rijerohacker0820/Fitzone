import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import apiClient from '../api/apiClient';
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react-native';

export default function MembershipScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { user, refreshUser } = useUser();
    
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await apiClient.get('/user/plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        Alert.alert(
            "Confirmar Suscripción",
            "¿Deseas pagar e inscribirte en este plan ahora?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Sí, Pagar", 
                    onPress: async () => {
                        setSubscribingTo(planId);
                        try {
                            const response = await apiClient.post(`/user/subscribe/${planId}`);
                            Alert.alert('¡Éxito!', 'Te has suscrito exitosamente al plan. El pago ha sido procesado.');
                            if (refreshUser) await refreshUser();
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data || 'No se pudo procesar tu inscripción.');
                        } finally {
                            setSubscribingTo(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={{ marginTop: 40, marginBottom: 24 }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>Suscripciones</Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}>
                    Mejora tu entrenamiento adquiriendo un plan.
                </Text>
            </View>

            {plans.length === 0 ? (
                <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 16, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>No hay planes disponibles por el momento.</Text>
                </View>
            ) : (
                plans.map(plan => {
                    // Normalize comparison just in case
                    const isCurrentPlan = user?.planId?.toLowerCase() === plan.id.toLowerCase();

                    return (
                        <View 
                            key={plan.id} 
                            style={{
                                backgroundColor: colors.card,
                                borderRadius: 20,
                                padding: 20,
                                marginBottom: 16,
                                borderWidth: isCurrentPlan ? 2 : 1,
                                borderColor: isCurrentPlan ? colors.primary : '#E2E8F0',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2,
                            }}
                        >
                            {isCurrentPlan && (
                                <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Plan Actual</Text>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: plan.planType.toLowerCase() === 'premium' ? '#FFFBEB' : '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Zap size={24} color={plan.planType.toLowerCase() === 'premium' ? '#D97706' : colors.primary} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{plan.name}</Text>
                                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>{plan.planType} • Mensual</Text>
                                </View>
                            </View>

                            <Text style={{ fontSize: 15, color: colors.text, marginBottom: 20, lineHeight: 22 }}>
                                {plan.description}
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 }}>
                                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>${plan.price}</Text>
                                <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 6, marginLeft: 4 }}>/mes</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleSubscribe(plan.id)}
                                disabled={isCurrentPlan || subscribingTo === plan.id}
                                style={{
                                    backgroundColor: isCurrentPlan ? '#E2E8F0' : colors.primary,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    opacity: subscribingTo === plan.id ? 0.7 : 1
                                }}
                            >
                                {subscribingTo === plan.id ? (
                                    <ActivityIndicator color={colors.card} />
                                ) : (
                                    <>
                                        <Text style={{ color: isCurrentPlan ? colors.textSecondary : colors.card, fontSize: 16, fontWeight: 'bold', marginRight: 8 }}>
                                            {isCurrentPlan ? 'Activado' : 'Elegir Plan'}
                                        </Text>
                                        {!isCurrentPlan && <ChevronRight color={colors.card} size={20} />}
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}
