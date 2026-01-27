import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    const prodUrl = 'https://payment-gateway-up7l.onrender.com/api';
    if (!envUrl) return prodUrl;

    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return envUrl;
    }

    if (envUrl.includes('localhost')) {
        return prodUrl;
    }
    return envUrl;
};

const API_URL = getApiUrl();

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

    const loadData = async () => {
        try {
            const [balRes, transRes] = await Promise.all([
                axios.get(`${API_URL}/wallet/balance`),
                axios.get(`${API_URL}/wallet/transactions`)
            ]);
            setBalance(balRes.data?.balance ?? 0);
            setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
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
        const salesCount = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'TRANSFER').length;
        const averageSale = salesCount > 0
            ? transactions.filter(t => t.type === 'PAYMENT' || t.type === 'TRANSFER').reduce((acc, t) => acc + t.amount, 0) / salesCount
            : 0;

        // Generate chart data from transactions
        const salesChartData = transactions.slice(0, 20).reverse().map(t => ({
            time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sales: t.amount
        }));

        // Cumulative revenue (simplified as balance over time if we had historical snapshots, but here we just use the list)
        let runningTotal = 0;
        const cumulativeRevenueData = transactions.slice().reverse().map(t => {
            runningTotal += t.amount;
            return {
                time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                sales: runningTotal
            };
        });

        const latestPayments = transactions.slice(0, 10).map(t => ({
            id: t.id,
            amount: t.amount,
            product: t.type,
            customer: t.sender_id === t.receiver_id ? 'System' : (t.sender_name || 'User'),
            time: new Date(t.created_at).toLocaleTimeString()
        }));

        return {
            totalRevenue: balance,
            cumulativeRevenueData,
            salesCount,
            averageSale,
            salesChartData,
            latestPayments,
            loading
        };
    }, [balance, transactions, loading]);

    return stats;
};
