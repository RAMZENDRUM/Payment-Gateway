import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import {
    Clock,
    Send,
    Search,
    Download,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    XCircle,
    Calendar
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import TransactionReceipt from '@/components/ui/transaction-receipt';


import { API_URL } from '@/lib/api';

interface Transaction {
    id: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    type: 'TRANSFER' | 'PAYMENT' | 'RECHARGE';
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    reference_id: string;
    created_at: string;
    sender_name: string;
    receiver_name: string;
    receiver_upi_id: string;
    balance_after?: number;
    app_name?: string;
    app_id?: string;
}

export default function Transactions() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/wallet/transactions`);
            setTransactions(res.data);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
            toast.error('Could not load transactions');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const isDebit = tx.sender_id === user?.id;
            const otherParty = isDebit ? tx.receiver_name : tx.sender_name;
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch =
                (tx.id && tx.id.toLowerCase().includes(searchLower)) ||
                (tx.reference_id && tx.reference_id.toLowerCase().includes(searchLower)) ||
                (otherParty && otherParty.toLowerCase().includes(searchLower)) ||
                (tx.amount && tx.amount.toString().includes(searchLower)) ||
                (tx.app_name && tx.app_name.toLowerCase().includes(searchLower));

            let matchesFilter = true;
            if (filterType === 'payment') {
                matchesFilter = tx.type === 'PAYMENT' && tx.sender_id === user?.id && !tx.app_id;
            } else if (filterType === 'received') {
                matchesFilter = tx.receiver_id === user?.id && tx.type !== 'RECHARGE' && !tx.app_id;
            } else if (filterType === 'topup') {
                matchesFilter = tx.type === 'RECHARGE';
            } else if (filterType === 'api') {
                matchesFilter = !!tx.app_id || (tx.type === 'PAYMENT' && (tx.reference_id?.includes('zw_') || tx.reference_id?.includes('INV')));
            }

            return matchesSearch && matchesFilter;
        });
    }, [transactions, searchTerm, filterType, user]);

    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};
        filteredTransactions.forEach(tx => {
            const date = new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!groups[date]) groups[date] = [];
            groups[date].push(tx);
        });
        return groups;
    }, [filteredTransactions]);

    const exportToExcel = () => {
        setIsExporting(true);
        try {
            const data = filteredTransactions.map(tx => ({
                'Date': new Date(tx.created_at).toLocaleDateString('en-IN'),
                'Time': new Date(tx.created_at).toLocaleTimeString('en-IN', { hour12: false }),
                'Transaction ID': tx.id,
                'Reference': tx.reference_id || 'N/A',
                'Type': tx.type,
                'Context': tx.sender_id === user?.id ? `Paid to ${tx.receiver_name}` : `Received from ${tx.sender_name}`,
                'Amount (INR)': tx.amount,
                'Sign': tx.sender_id === user?.id ? '-' : '+',
                'Balance After': tx.balance_after || 'N/A',
                'Status': tx.status
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

            // Generate buffer
            XLSX.writeFile(workbook, `ZenWallet_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success('Excel statement exported');
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };



    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle2 className="text-emerald-500" size={14} />;
            case 'FAILED': return <XCircle className="text-red-500" size={14} />;
            default: return <Clock className="text-amber-500" size={14} />;
        }
    };

    const getTypeStyles = (type: string, isDebit: boolean) => {
        if (isDebit) return "bg-red-500/10 text-red-400 border-red-500/20";
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    };

    return (
        <AppLayout title="Transaction History" subtitle="Manage and track all your movements">
            <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* Header Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                        <Input
                            placeholder="Find transfers, recharges..."
                            className="bg-zinc-900 border-zinc-800 pl-10 h-11 focus-visible:ring-violet-500/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                            {[
                                { id: 'all', label: 'All Payments' },
                                { id: 'payment', label: 'Payment' },
                                { id: 'received', label: 'Received' },
                                { id: 'topup', label: 'Top up' },
                                { id: 'api', label: 'API' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setFilterType(filter.id)}
                                    className={`px-4 py-1.5 text-[11px] font-medium rounded-md transition-all ${filterType === filter.id
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-white'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            className="border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-medium text-xs"
                            onClick={exportToExcel}
                            disabled={isExporting || filteredTransactions.length === 0}
                        >
                            <Download size={14} className="mr-2" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                <div className="border-pane">
                    <div className="bg-[#0c0c0e] px-6 py-4 flex items-center justify-between border-b border-white/5">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-violet-400" />
                            Transaction Log
                        </h3>
                        <span className="text-[11px] text-zinc-500 font-medium">
                            {filteredTransactions.length} items logged
                        </span>
                    </div>

                    <div>
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                                <div className="h-8 w-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                                <p className="text-zinc-600 text-[11px] font-medium">Synchronizing ledger...</p>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="h-12 w-12 bg-zinc-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800/50">
                                    <Search className="text-zinc-600" size={20} />
                                </div>
                                <h4 className="text-zinc-200 text-sm font-medium">No results found</h4>
                                <p className="text-zinc-500 text-[11px] max-w-xs mx-auto mt-1">
                                    Adjust search parameters or clear filters to find movements.
                                </p>
                                <Button
                                    variant="link"
                                    className="text-violet-400 text-xs mt-4"
                                    onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                                >
                                    Clear filters
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-zinc-900/50">
                                        <AnimatePresence>
                                            {Object.entries(groupedTransactions).map(([date, txs]) => (
                                                <div key={date} className="contents">
                                                    {/* Date Header (UP) */}
                                                    <tr className="bg-zinc-950/50">
                                                        <td colSpan={6} className="px-6 py-2.5 text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em] border-y border-white/5">
                                                            {date}
                                                        </td>
                                                    </tr>
                                                    {/* Column Headers (DOWN) */}
                                                    <tr className="bg-[#101012]/30 text-zinc-500 text-[9px] font-bold uppercase tracking-wider border-b border-zinc-900">
                                                        <th className="px-6 py-2 font-bold">Time</th>
                                                        <th className="px-6 py-2 font-bold">Context</th>
                                                        <th className="px-6 py-2 text-right font-bold">Value (INR)</th>
                                                        <th className="px-6 py-2 text-center font-bold">Wallet Balance</th>
                                                        <th className="px-6 py-2 text-center font-bold">State</th>
                                                        <th className="px-6 py-2 text-right font-bold">Actions</th>
                                                    </tr>
                                                    {txs.map((tx) => {
                                                        const isDebit = tx.sender_id === user?.id;
                                                        const otherParty = isDebit ? tx.receiver_name : tx.sender_name;

                                                        return (
                                                            <motion.tr
                                                                key={tx.id}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="group hover:bg-white/[0.01] transition-all cursor-pointer"
                                                            >
                                                                <td className="px-6 py-5" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-bold text-zinc-400 tabular-nums">
                                                                            {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${isDebit ? 'bg-red-500/5 border-red-500/10 text-red-500' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                                                            }`}>
                                                                            {isDebit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                                                                                {tx.app_name ? <span className="text-violet-400 font-bold">{tx.app_name} <span className="text-[10px] text-zinc-600 ml-1">(API)</span></span> : (otherParty || 'System Transfer')}
                                                                            </p>
                                                                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                                                                                ID: {tx.id.slice(0, 12).toUpperCase()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-right" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`text-[13px] font-bold tabular-nums ${isDebit ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                            {isDebit ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-center" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <span className="text-[12px] font-bold text-zinc-500 tabular-nums">
                                                                        ₹{tx.balance_after ? Number(tx.balance_after).toLocaleString() : '---'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5 text-center" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/50 w-fit mx-auto">
                                                                        {getStatusIcon(tx.status)}
                                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{tx.status === 'SUCCESS' ? 'Settled' : tx.status}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {isDebit && !tx.app_id && tx.type !== 'RECHARGE' && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-8 px-3 text-[10px] font-bold uppercase text-violet-400 hover:text-violet-300 hover:bg-violet-400/10"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(`/send?to=${tx.receiver_upi_id}`);
                                                                                }}
                                                                            >
                                                                                Pay Again
                                                                            </Button>
                                                                        )}
                                                                        <button onClick={() => { setSelectedTx(tx); setShowReceipt(true); }} className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-600 hover:text-white transition-all">
                                                                            <ChevronRight size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Info */}
                {!loading && filteredTransactions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border-pane p-6 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-500 text-[11px] font-medium">Activity Volume</p>
                                    <h4 className="text-2xl font-medium text-white mt-1 tabular-nums tracking-tight">
                                        ₹{filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                                    </h4>
                                </div>
                                <div className="p-3 bg-violet-500/5 rounded-xl text-violet-400 group-hover:scale-110 transition-transform border border-violet-500/10">
                                    <Clock size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <TransactionReceipt
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                transaction={selectedTx}
            />
        </AppLayout>
    );
}
