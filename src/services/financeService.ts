import apiClient from '../api/apiClient';

export interface PendingTransaction {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    amount: number;
    reference: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
    planName?: string;
}

/**
 * GET /api/admin/finance/pending
 * Fetch all pending transactions for admin review
 */
export const getPendingTransactions = async (): Promise<PendingTransaction[]> => {
    const response = await apiClient.get('/admin/finance/pending');
    return response.data;
};

/**
 * PUT /api/admin/finance/{id}/approve
 */
export const approveTransaction = async (id: string): Promise<void> => {
    await apiClient.put(`/admin/finance/${id}/approve`);
};

/**
 * PUT /api/admin/finance/{id}/reject
 */
export const rejectTransaction = async (id: string): Promise<void> => {
    await apiClient.put(`/admin/finance/${id}/reject`);
};

/**
 * PUT /api/admin/finance/{id}/retry
 */
export const retryTransaction = async (id: string): Promise<void> => {
    await apiClient.put(`/admin/finance/${id}/retry`);
};
