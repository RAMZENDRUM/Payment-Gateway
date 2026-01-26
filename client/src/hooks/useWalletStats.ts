import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const useWalletStats = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [balRes, transRes] = await Promise.all([
                axios.get(`${API_URL}/wallet/balance`),
                axios.get(`${API_URL}/wallet/transactions`)
            ]);
            setBalance(balRes.data.balance);
            setTransactions(transRes.data);
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
