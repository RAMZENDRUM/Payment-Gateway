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
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-violet-500 transition-colors" size={18} />
                        <Input
                            placeholder="Find transfers, recharges..."
                            className="bg-muted/40 border-border pl-11 h-12 focus-visible:ring-violet-500/20 text-base rounded-2xl placeholder:text-muted-foreground/60 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-muted/40 p-1 rounded-xl border border-border">
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
                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${filterType === filter.id
                                        ? 'bg-background text-foreground shadow-sm border border-border/50'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            className="h-11 border-border bg-background hover:bg-muted text-foreground font-bold text-[11px] uppercase tracking-widest px-6 rounded-xl transition-all shadow-sm"
                            onClick={exportToExcel}
                            disabled={isExporting || filteredTransactions.length === 0}
                        >
                            <Download size={14} className="mr-2.5 text-violet-500" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="border-pane overflow-hidden bg-card/10 backdrop-blur-sm">
                    <div className="bg-muted/20 px-6 py-4.5 flex items-center justify-between border-b border-border/40">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2.5 uppercase tracking-widest">
                            <Calendar className="h-4 w-4 text-violet-500" />
                            Security Ledger
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2.5 py-1 rounded-md">
                            {filteredTransactions.length} Identities
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
                                    <tbody className="divide-y divide-border/20">
                                        <AnimatePresence>
                                            {Object.entries(groupedTransactions).map(([date, txs]) => (
                                                <div key={date} className="contents">
                                                    {/* Date Header (UP) */}
                                                    <tr className="bg-muted/40">
                                                        <td colSpan={6} className="px-6 py-3.5 text-[10px] font-black text-violet-500 uppercase tracking-[0.25em] border-y border-border/30">
                                                            {date}
                                                        </td>
                                                    </tr>
                                                    {/* Column Headers (DOWN) */}
                                                    <tr className="bg-background/40 text-muted-foreground text-[9px] font-black uppercase tracking-[0.15em] border-b border-border/20">
                                                        <th className="px-6 py-4">Time</th>
                                                        <th className="px-6 py-10">Asset Context</th>
                                                        <th className="px-6 py-4 text-right">Settlement</th>
                                                        <th className="px-6 py-4 text-center">Node State</th>
                                                        <th className="px-6 py-4 text-center">Protocol</th>
                                                        <th className="px-6 py-4 text-right">Access</th>
                                                    </tr>
                                                    {txs.map((tx) => {
                                                        const isDebit = tx.sender_id === user?.id;
                                                        const otherParty = isDebit ? tx.receiver_name : tx.sender_name;

                                                        return (
                                                            <motion.tr
                                                                key={tx.id}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="group hover:bg-muted/10 transition-all cursor-pointer border-b border-border/5"
                                                            >
                                                                <td className="px-6 py-6" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                                                                            {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 shadow-sm ${isDebit ? 'bg-red-500/5 border-red-500/10 text-red-500' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                                                            }`}>
                                                                            {isDebit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[14px] font-black text-foreground group-hover:text-violet-500 transition-colors tracking-tight">
                                                                                {tx.app_name ? <span className="text-violet-500 font-black">{tx.app_name} <span className="text-[9px] text-muted-foreground ml-1 uppercase">(API)</span></span> : (otherParty || 'System Transfer')}
                                                                            </p>
                                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-1.5 opacity-60">
                                                                                ID: {tx.id.slice(0, 12).toUpperCase()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-right" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`text-[15px] font-black tabular-nums tracking-tight ${isDebit ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                            {isDebit ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-center" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <span className="text-[13px] font-bold text-muted-foreground tabular-nums">
                                                                        ₹{tx.balance_after ? Number(tx.balance_after).toLocaleString() : '---'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-6 text-center" onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}>
                                                                    <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/10 w-fit mx-auto shadow-sm">
                                                                        {getStatusIcon(tx.status)}
                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{tx.status === 'SUCCESS' ? 'Settled' : tx.status}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {isDebit && !tx.app_id && tx.type !== 'RECHARGE' && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 rounded-lg transition-all"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(`/send?to=${tx.receiver_upi_id}`);
                                                                                }}
                                                                            >
                                                                                Pay Again
                                                                            </Button>
                                                                        )}
                                                                        <button onClick={() => { setSelectedTx(tx); setShowReceipt(true); }} className="p-2.5 hover:bg-muted/60 rounded-xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border/40">
                                                                            <ChevronRight size={16} />
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
