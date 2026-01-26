"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';

const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

export default function Send() {
    const [receiverEmail, setReceiverEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiverEmail || !amount) return;

        setLoading(true);
        try {
            await axios.post(`${API_URL}/wallet/send`, {
                receiverEmail,
                amount: parseFloat(amount),
                referenceId
            });
            setSuccess(true);
            toast.success('Transaction Successful');
            setTimeout(() => navigate('/dashboard'), 2500);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="h-full w-full overflow-y-auto">
                {/* Page Header */}
                <div className="px-8 py-5 bg-[#0f0f10] border-b border-slate-800/30">
                    <div className="max-w-[1600px] mx-auto">
                        <h1 className="text-xl font-semibold text-white tracking-tight">Send Coins</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Transfer funds instantly to any recipient</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-8 py-12 max-w-[600px] mx-auto">
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="send-content"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                            >
                                <form onSubmit={handleSend} className="space-y-6">
                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recipient Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            autoFocus
                                            required
                                            className="h-11 bg-[#13131a] border-slate-800/30 focus:border-cyan-500/50 rounded-md placeholder:text-slate-700 transition-all"
                                            value={receiverEmail}
                                            onChange={(e) => setReceiverEmail(e.target.value)}
                                        />
                                    </div>

                                    {/* Amount Section */}
                                    <div className="space-y-3 pt-4 border-t border-slate-800/30">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Amount</Label>
                                            <span className="text-xs text-slate-600 font-medium tabular-nums">Available: 5,000.00 C</span>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full bg-transparent border-none p-0 text-6xl font-semibold tabular-nums text-white focus:outline-none placeholder:text-slate-800 transition-colors"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                            <span className="absolute right-0 bottom-2 text-sm font-semibold text-slate-600">COINS</span>
                                        </div>
                                        <div className="h-[1px] w-full bg-slate-800/50 group-focus-within:bg-cyan-500/50 transition-colors" />
                                    </div>

                                    {/* Optional Note */}
                                    <div className="space-y-2">
                                        <Label htmlFor="note" className="text-xs text-slate-500 font-medium uppercase tracking-wider">Note (Optional)</Label>
                                        <Input
                                            id="note"
                                            placeholder="What's this for?"
                                            className="h-10 bg-[#13131a] border-slate-800/30 focus:border-cyan-500/50 rounded-md placeholder:text-slate-700 text-sm"
                                            value={referenceId}
                                            onChange={(e) => setReferenceId(e.target.value)}
                                        />
                                    </div>

                                    {/* Confirmation Note */}
                                    <div className="flex gap-3 p-4 bg-slate-900/20 border border-slate-800/30 rounded-md items-start">
                                        <Info size={14} className="text-amber-500/60 mt-0.5 shrink-0" />
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Coins are transferred immediately. Verify the recipient's email before confirming. This action is irreversible.
                                        </p>
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all rounded-md mt-6 active:scale-[0.99]"
                                    >
                                        {loading ? 'Processing...' : 'Confirm and Send'}
                                    </Button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success-content"
                                initial={{ opacity: 0, scale: 0.99 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#13131a] border border-slate-800/30 p-12 rounded-md flex flex-col items-center justify-center space-y-6"
                            >
                                <div className="h-16 w-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <CheckCircle2 className="h-8 w-8 text-cyan-500" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Transaction Successful</h3>
                                    <p className="text-slate-500 text-sm">Successfully sent <span className="text-white font-semibold tabular-nums">{parseFloat(amount).toFixed(2)} COINS</span> to<br /><span className="text-cyan-400">{receiverEmail}</span></p>
                                </div>
                                <div className="pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate('/dashboard')}
                                        className="text-slate-500 hover:text-white text-sm font-medium"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AppLayout>
    );
}
