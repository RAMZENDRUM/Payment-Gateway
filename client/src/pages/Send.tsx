"use client";

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';
import TransactionReceipt, { TransactionData } from '@/components/ui/transaction-receipt';


const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

export default function Send() {
    const navigate = useNavigate();
    const location = useLocation();
    const [receiverUpiId, setReceiverUpiId] = useState(location.state?.receiverId || '');
    const [amount, setAmount] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [txDetails, setTxDetails] = useState<TransactionData | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiverUpiId || !amount) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/wallet/send`, {
                receiverUpiId,
                amount: parseFloat(amount),
                referenceId
            });
            setTxDetails(res.data.transaction);
            setSuccess(true);
            setShowReceipt(true);
            toast.success('Transaction Successful');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Send Coins" subtitle="Transfer funds instantly to any recipient secure and fast.">
            <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-700 p-4 lg:p-6">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 xl:gap-24 items-center">

                    {/* Left Column: Form */}
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute -left-20 top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 text-emerald-500 text-[11px] font-medium mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Secured by Zen Protocol
                            </div>
                            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Transfer Money</h2>
                            <p className="text-zinc-500 text-base font-medium leading-relaxed max-w-sm">Pay anyone instantly using their UPI ID or mobile number.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {!success ? (
                                <motion.form
                                    key="send-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleSend}
                                    className="space-y-12 relative z-10"
                                >
                                    <div className="space-y-12">
                                        <div className="relative group/input">
                                            <Label className="text-[13px] font-medium text-zinc-500 mb-6 block">Enter Amount</Label>
                                            <div className="flex items-baseline gap-4">
                                                <span className="text-3xl text-zinc-700 font-medium font-sans">₹</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full bg-transparent border-none p-0 text-7xl font-semibold tracking-tight text-white focus:outline-none placeholder:text-zinc-800 tabular-nums caret-blue-500"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-8 text-xs font-medium text-zinc-500">
                                                <span>ZenWallet Balance</span>
                                                <span className="text-zinc-400">₹5,00,000.00</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[13px] font-medium text-zinc-500 block px-1">UPI ID / Number</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. user@zen or 9876543210"
                                                    required
                                                    className="h-14 bg-white/[0.02] border-zinc-400/10 text-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-emerald-500/20"
                                                    value={receiverUpiId}
                                                    onChange={(e) => setReceiverUpiId(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[13px] font-medium text-zinc-500 block px-1">Add a Note</Label>
                                                <Input
                                                    placeholder="What's this for? (Optional)"
                                                    className="h-14 bg-white/[0.02] border-zinc-400/10 text-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-white/5"
                                                    value={referenceId}
                                                    onChange={(e) => setReferenceId(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        size="lg"
                                        className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-semibold text-base rounded-2xl transition-all active:scale-95 shadow-2xl"
                                    >
                                        {loading ? 'Processing Payment...' : 'Pay Now'}
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 text-center lg:text-left"
                                >
                                    <div className="h-16 w-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 mx-auto lg:mx-0">
                                        <CheckCircle2 className="h-8 w-8 text-black" />
                                    </div>
                                    <h3 className="text-4xl font-bold text-white tracking-tight mb-4">Payment Successful</h3>
                                    <p className="text-zinc-500 text-lg mb-10 max-w-sm font-medium leading-relaxed">
                                        You have successfully paid <span className="text-white">₹{parseFloat(amount).toLocaleString()}</span> to <span className="text-emerald-500">{receiverUpiId}</span>.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/dashboard')}
                                        className="h-12 px-6 border-zinc-700 text-white hover:bg-zinc-800 rounded-xl"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Dynamic Abstract Visual */}
                    <div className="order-1 lg:order-2 relative hidden lg:flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/20 to-cyan-500/20 rounded-[3rem] blur-3xl opacity-20" />
                        <div className="relative w-full aspect-[4/5] bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-[2.5rem] overflow-hidden">
                            {/* Abstract Decorative Elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-30">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/30 rounded-full blur-[80px] animate-pulse" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/30 rounded-full blur-[80px] animate-pulse delay-1000" />
                            </div>

                            <div className="relative h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl shadow-2xl shadow-emerald-500/20 flex items-center justify-center transform -rotate-12">
                                    <div className="text-zinc-900 text-4xl font-bold">➜</div>
                                </div>
                                <div className="space-y-2 max-w-xs mx-auto">
                                    <h3 className="text-xl font-bold text-white">Fast & Secure</h3>
                                    <p className="text-zinc-500 text-sm">Your transactions are protected by end-to-end encryption and processed instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <TransactionReceipt
                isOpen={showReceipt}
                onClose={() => {
                    setShowReceipt(false);
                    navigate('/dashboard');
                }}
                transaction={txDetails}
            />
        </AppLayout>
    );
}
