import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@/AuthContext';

import { API_URL } from '@/lib/api';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    created_at: string;
    sender_id?: string;
    receiver_id?: string;
    sender_name?: string;
}

export const useWalletStats = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    const loadData = async () => {
        try {
            const [balRes, transRes] = await Promise.all([
                axios.get(`${API_URL}/wallet/balance`),
                axios.get(`${API_URL}/wallet/transactions`)
            ]);
            setBalance(parseFloat(balRes.data?.balance || '0'));
            const txs = Array.isArray(transRes.data) ? transRes.data : [];
            setTransactions(txs.map((t: any) => ({
                ...t,
                amount: parseFloat(t.amount)
            })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll every 5s for "real-time" feel
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const spendingTransactions = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'TRANSFER');
        const salesCount = spendingTransactions.length;
        const totalSpent = spendingTransactions.reduce((acc, t) => acc + t.amount, 0);
        const averageSale = salesCount > 0 ? totalSpent / salesCount : 0;

        // Sort chronologically for charts
        const chronTransactions = transactions.slice(0, 20).reverse();

        // Graph 1: Money In vs Money Out
        const moneyFlowData = chronTransactions.map(t => {
            const isIncoming = t.receiver_id === user?.id && t.sender_id !== user?.id; // Self-pay blocked but just in case
            // If sender is me, it's Out via Transfer or Payment. If receiver is me, it's In.
            // Note: Recharge is IN (receiver=me, sender=null/system).

            return {
                time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                moneyIn: t.receiver_id === user?.id ? t.amount : 0,
                moneyOut: t.sender_id === user?.id ? t.amount : 0
            };
        });

        // Graph 2: Avg Transaction Value (Cumulative Running Average)
        let runningSum = 0;
        let count = 0;
        const transactionQualityData = chronTransactions.map(t => {
            runningSum += t.amount;
            count++;
            return {
                time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avgValue: Math.round(runningSum / count)
            };
        });

        const latestPayments = transactions.slice(0, 8).map(t => ({
            id: t.id,
            amount: t.amount,
            product: t.type,
            customer: t.sender_id === t.receiver_id ? 'System' : (t.sender_name || 'User'),
            time: `${new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • ${new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        }));

        return {
            totalRevenue: balance,
            moneyFlowData,
            transactionQualityData,
            salesCount,
            totalSpent,
            averageSale,
            latestPayments,
            loading
        };
    }, [balance, transactions, loading, user]);

    return stats;
};
