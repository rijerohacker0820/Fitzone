import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import {
    getPendingTransactions,
    approveTransaction,
    rejectTransaction,
    retryTransaction,
    PendingTransaction
} from '../services/financeService';

export default function FinanceScreen() {
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        try {
            const data = await getPendingTransactions();
            setTransactions(data);
        } catch (error: any) {
            showToast(error.message || 'Error al cargar transacciones', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const handleAction = async (id: string, action: 'approve' | 'reject' | 'retry') => {
        if (actionInProgress) return; // Prevent double-submit

        setActionInProgress(id);
        try {
            switch (action) {
                case 'approve':
                    await approveTransaction(id);
                    showToast('Transacción aprobada', 'success');
                    break;
                case 'reject':
                    await rejectTransaction(id);
                    showToast('Transacción rechazada', 'info');
                    break;
                case 'retry':
                    await retryTransaction(id);
                    showToast('Transacción reenviada', 'success');
                    break;
            }
            // Refresh list after action
            await fetchTransactions();
        } catch (error: any) {
            showToast(error.message || `Error al ${action === 'approve' ? 'aprobar' : action === 'reject' ? 'rechazar' : 'reintentar'}`, 'error');
        } finally {
            setActionInProgress(null);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
                    Finanzas
                </Text>
                <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
                    Transacciones pendientes de aprobación
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingTop: 8 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {transactions.length === 0 ? (
                    <View style={{
                        backgroundColor: colors.card,
                        padding: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
                            Todo al día
                        </Text>
                        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                            No hay transacciones pendientes
                        </Text>
                    </View>
                ) : (
                    transactions.map(tx => {
                        const isProcessing = actionInProgress === tx.id;
                        const date = new Date(tx.createdAt);
                        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

                        return (
                            <View
                                key={tx.id}
                                style={{
                                    backgroundColor: colors.card,
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: colors.secondary + '20',
                                    opacity: isProcessing ? 0.6 : 1,
                                }}
                            >
                                {/* Header */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
                                            {tx.userName || tx.userEmail}
                                        </Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                                            {tx.userEmail}
                                        </Text>
                                    </View>
                                    <View style={{
                                        backgroundColor: '#FEF3C7',
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                        alignSelf: 'flex-start',
                                    }}>
                                        <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '700' }}>
                                            {tx.status || 'Pendiente'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Details */}
                                <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 10, marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Monto:</Text>
                                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 15 }}>${tx.amount}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Referencia:</Text>
                                        <Text style={{ color: colors.text, fontSize: 13 }}>{tx.reference || 'N/A'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Método:</Text>
                                        <Text style={{ color: colors.text, fontSize: 13 }}>{tx.paymentMethod || 'N/A'}</Text>
                                    </View>
                                    {tx.planName && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Plan:</Text>
                                            <Text style={{ color: colors.text, fontSize: 13 }}>{tx.planName}</Text>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Fecha:</Text>
                                        <Text style={{ color: colors.text, fontSize: 13 }}>{formattedDate}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => handleAction(tx.id, 'approve')}
                                        disabled={isProcessing}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#059669',
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        {isProcessing ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Aprobar</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleAction(tx.id, 'reject')}
                                        disabled={isProcessing}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#DC2626',
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Rechazar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleAction(tx.id, 'retry')}
                                        disabled={isProcessing}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#2563EB',
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Reintentar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
