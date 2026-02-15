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
import TransactionReceipt from '@/components/ui/transaction-receipt';
import type { TransactionData } from '@/components/ui/transaction-receipt';
import { useAuth } from '@/AuthContext';
import { API_URL } from '@/lib/api';
import { PinModal } from '@/components/ui/PinModal';




export default function Send() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const toParam = queryParams.get('to');
    const [receiverUpiId, setReceiverUpiId] = useState(toParam || location.state?.receiverId || '');
    const [amount, setAmount] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [txDetails, setTxDetails] = useState<TransactionData | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const [showPinModal, setShowPinModal] = useState(false);

    const handleSend = async (pin: string) => {
        if (!receiverUpiId || !amount) return;
        setLoading(true);
        setShowPinModal(false);
        try {
            const apiCall = axios.post(`${API_URL}/wallet/send`, {
                receiverUpiId,
                amount: parseFloat(amount),
                referenceId,
                pin
            });

            const [res] = await Promise.all([
                apiCall,
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

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

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiverUpiId || !amount) return;
        if (parseFloat(amount) > 200000) {
            toast.error('Maximum sending limit is ₹2,00,000');
            return;
        }
        if (!user?.hasPaymentPin) {
            toast.error('Please setup your Payment PIN first');
            navigate('/setup-pin');
            return;
        }
        setShowPinModal(true);
    };

    return (
        <AppLayout title="Send INR" subtitle="Transfer INR instantly to any recipient secure and fast.">
            <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-700 p-4 lg:p-6 lg:pt-12">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 xl:gap-24 items-start">

                    {/* Left Column: Form */}
                    <div className="order-2 lg:order-1 relative p-8 lg:p-12 bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] shadow-2xl">
                        <div className="absolute -left-20 top-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="mb-14">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider mb-6 border border-primary/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Secured Transaction
                            </div>
                            <h2 className="text-4xl font-black text-foreground tracking-tight mb-4 uppercase">Transfer Money</h2>
                            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs italic opacity-80">Pay anyone instantly using their unique ID or mobile endpoint.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {!success ? (
                                <motion.form
                                    key="send-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleFormSubmit}
                                    className="space-y-12 relative z-10"
                                >
                                    <div className="space-y-12">
                                        <div className="relative group/input">
                                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8 block opacity-60">Amount to Send</Label>
                                            <div className="flex items-center gap-6 pb-6 border-b border-border/60 group-focus-within/input:border-primary transition-all duration-500">
                                                <span className="text-4xl text-muted-foreground font-black select-none opacity-40">₹</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max="200000"
                                                    step="1"
                                                    placeholder="0"
                                                    className="w-full bg-transparent border-none p-0 text-7xl font-black tracking-tighter text-foreground focus:outline-none placeholder:text-muted/20 tabular-nums"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                                                <span>Current Balance</span>
                                                <span className="text-primary">₹{user?.balance?.toLocaleString() || '0'}</span>
                                            </div>

                                            {/* Quick Amount Picks */}
                                            <div className="flex gap-2 mt-8">
                                                {[100, 500, 1000, 2000].map((amt) => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setAmount(amt.toString())}
                                                        className="flex-1 h-11 rounded-xl bg-muted/30 border border-border/50 text-[10px] font-black text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all uppercase tracking-widest shadow-sm"
                                                    >
                                                        +₹{amt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block px-1 opacity-60">Receiver Address</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. user@zen"
                                                    required
                                                    className="h-14 bg-muted/20 border-border text-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-bold tracking-tight transition-all"
                                                    value={receiverUpiId}
                                                    onChange={(e) => setReceiverUpiId(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block px-1 opacity-60">Payment Note</Label>
                                                <Input
                                                    placeholder="Add a comment"
                                                    className="h-14 bg-muted/20 border-border text-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-bold tracking-tight transition-all"
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
                                        className="w-full h-16 bg-foreground text-background hover:bg-foreground/90 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-[0.98] shadow-2xl border-none"
                                    >
                                        {loading ? 'Authorizing Transcation...' : 'Execute Payment'}
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 text-center lg:text-left"
                                >
                                    <div className="h-20 w-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/10 mb-10 mx-auto lg:mx-0 -rotate-3">
                                        <CheckCircle2 className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-4xl font-black text-foreground tracking-tight mb-6 uppercase">Payment Executed</h3>
                                    <p className="text-muted-foreground text-base mb-12 max-w-sm font-medium leading-relaxed italic opacity-80">
                                        Successfully transferred <span className="text-foreground font-black not-italic">₹{parseFloat(amount).toLocaleString()}</span> to <span className="text-primary font-black not-italic">{receiverUpiId}</span>.
                                    </p>
                                    <div className="flex gap-4">
                                        <Button
                                            onClick={() => navigate('/dashboard')}
                                            className="h-12 px-8 bg-muted text-foreground hover:bg-muted/80 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                        >
                                            Return Home
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setSuccess(false); setAmount(''); setReceiverUpiId(''); }}
                                            className="h-12 px-8 border-border text-muted-foreground hover:text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest"
                                        >
                                            Next Transfer
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Visual Section */}
                    <div className="order-1 lg:order-2 space-y-8 animate-in slide-in-from-right-10 duration-1000">
                        <div className="p-8 lg:p-10 bg-violet-600 rounded-[2.5rem] shadow-2xl shadow-violet-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8">
                                <Info size={24} className="text-white/40" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                    <CheckCircle2 className="text-white" size={28} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-white leading-tight">Zero-Knowledge Transfers</h3>
                                    <p className="text-violet-100/70 text-sm font-medium leading-relaxed">
                                        ZenWallet uses the Zen Protocol to ensure your transaction details are encrypted and private, with near-instant finality.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-1.5 w-8 rounded-full bg-white/20" />
                                    ))}
                                    <div className="h-1.5 w-12 rounded-full bg-white animate-pulse" />
                                </div>
                            </div>

                            {/* Decorative background grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        </div>

                        <div className="dashboard-card p-8 flex items-center justify-between group cursor-help bg-card border-border/40">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Global Reach</p>
                                <h4 className="text-foreground text-sm font-bold uppercase tracking-tight">ZEN-24 Network Status</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Operational</span>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
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

            <PinModal
                isOpen={showPinModal}
                onVerify={handleSend}
                onCancel={() => setShowPinModal(false)}
                amount={parseFloat(amount)}
                title="Transfer Authorization"
            />
        </AppLayout>
    );
}
