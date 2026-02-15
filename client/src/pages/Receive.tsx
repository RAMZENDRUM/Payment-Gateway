"use client";

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, RefreshCw, Info, ChevronDown, ChevronUp, Percent, Receipt, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/AuthContext';

import { API_URL } from '@/lib/api';

export default function Receive() {
    const [amount, setAmount] = useState('');
    const [qrData, setQrData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced options
    const [taxName, setTaxName] = useState('GST');
    const [taxPercentage, setTaxPercentage] = useState('');
    const [feesAmount, setFeesAmount] = useState('');

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        let timer: any;
        if (qrData && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setQrData(null);
            toast.error('Payment request expired');
        }
        return () => clearInterval(timer);
    }, [qrData, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const generateQR = async (e: React.FormEvent) => {
        e.preventDefault();

        const amtValue = parseFloat(amount);
        if (!amount || amtValue <= 0) return;
        if (amtValue > 200000) {
            toast.error('Maximum request limit is ₹2,00,000');
            return;
        }

        if (!user?.hasPaymentPin) {
            toast.error('Please setup your Payment PIN first');
            navigate('/setup-pin');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/wallet/qr/create`, {
                amount: amtValue,
                referenceId: 'Payment Request',
                taxName: showAdvanced ? taxName : undefined,
                taxPercentage: showAdvanced && taxPercentage ? parseFloat(taxPercentage) : undefined,
                feesAmount: showAdvanced && feesAmount ? parseFloat(feesAmount) : undefined
            });
            setQrData(res.data.qrData);
            setTimeLeft(300); // Reset timer on new generation
        } catch (err) {
            toast.error('Failed to generate request');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (qrData) {
            navigator.clipboard.writeText(qrData);
            toast.success('Payment Link copied');
        }
    };

    return (
        <AppLayout title="Receive Assets" subtitle="Generate a high-security clearance token to receive assets.">
            <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-700 p-4 lg:p-12">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-start animate-in fade-in slide-in-from-bottom-2 duration-700">

                    {/* Left Column: Form & Actions */}
                    <div className="space-y-10 relative p-8 lg:p-10 bg-[#0c0c0e]/50 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden">
                        <div className="absolute -left-20 top-20 w-80 h-80 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

                        <div className="relative">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-6 border border-emerald-500/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Receive Payment
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Request Payment</h2>
                            <p className="text-zinc-400 text-sm">
                                Enter amount to generate a payment request.
                            </p>
                        </div>

                        {!qrData ? (
                            <motion.form key="entry-form" className="space-y-8" onSubmit={generateQR}>
                                <div className="space-y-8">
                                    <div className="relative group/input">
                                        <Label className="text-sm font-medium text-zinc-400 mb-2 block">Amount</Label>
                                        <div className="flex items-center gap-4 pb-4 border-b border-white/5 group-focus-within/input:border-emerald-500/30 transition-all duration-500">
                                            <span className="text-3xl text-zinc-600 font-bold select-none">₹</span>
                                            <input
                                                type="number"
                                                required
                                                placeholder="0.00"
                                                className="w-full bg-transparent border-none p-0 text-5xl font-bold tracking-tight text-white focus:outline-none placeholder:text-zinc-800 tabular-nums"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-emerald-500 transition-colors"
                                    >
                                        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {showAdvanced ? 'Hide Details' : 'Add Tax / Fees'}
                                    </button>

                                    <AnimatePresence>
                                        {showAdvanced && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="grid grid-cols-2 gap-6 overflow-hidden pt-2"
                                            >
                                                <div className="space-y-3">
                                                    <Label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tax Type</Label>
                                                    <div className="relative">
                                                        <Receipt size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <input
                                                            type="text"
                                                            value={taxName}
                                                            onChange={(e) => setTaxName(e.target.value)}
                                                            className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-9 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/30 transition-all uppercase"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">GST Rate (%)</Label>
                                                    <div className="relative">
                                                        <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <input
                                                            type="number"
                                                            placeholder="18"
                                                            value={taxPercentage}
                                                            onChange={(e) => setTaxPercentage(e.target.value)}
                                                            className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-9 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/30 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-3">
                                                    <Label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Protocol Fees (INR)</Label>
                                                    <div className="relative">
                                                        <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={feesAmount}
                                                            onChange={(e) => setFeesAmount(e.target.value)}
                                                            className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-9 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <Button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-14 bg-white text-black font-semibold text-sm rounded-xl transition-all active:scale-[0.98] shadow-xl hover:bg-zinc-100"
                                >
                                    {loading ? 'Processing...' : 'Generate QR Code'}
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div key="qr-result-text" className="space-y-10">
                                <div>
                                    <p className="text-sm font-medium text-zinc-400 mb-2">Request Amount</p>
                                    <h2 className="text-6xl font-bold text-white tabular-nums tracking-tight">₹{parseFloat(amount).toLocaleString()}</h2>
                                    {showAdvanced && (
                                        <div className="mt-4 flex gap-4 text-xs font-medium text-emerald-500/80">
                                            {taxPercentage && <span>+ {taxPercentage}% {taxName}</span>}
                                            {feesAmount && <span>+ ₹{feesAmount} Fees</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={copyLink}
                                        className="h-12 bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.1] rounded-xl font-semibold text-xs uppercase tracking-wider transition-all"
                                    >
                                        <Copy size={16} className="mr-2" />
                                        Copy Link
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setQrData(null); setShowAdvanced(false); }}
                                        className="h-12 bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.1] rounded-xl font-semibold text-xs uppercase tracking-wider transition-all"
                                    >
                                        <RefreshCw size={16} className="mr-2" />
                                        Reset
                                    </Button>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                                        Dynamic window expires in {formatTime(timeLeft)}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column: QR Visualization */}
                    <div className="relative flex flex-col items-center justify-center py-10">
                        <div className="absolute inset-0 bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

                        <AnimatePresence mode="wait">
                            {!qrData ? (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-center space-y-10"
                                >
                                    <div className="h-64 w-64 mx-auto border-2 border-dashed border-white/5 rounded-[3.5rem] flex items-center justify-center p-8 bg-zinc-900/10 backdrop-blur-sm relative group">
                                        <div className="h-full w-full bg-zinc-900/40 rounded-[2.5rem] flex items-center justify-center transition-all group-hover:bg-zinc-900/60">
                                            <Wallet size={48} strokeWidth={1} className="text-zinc-800" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-semibold text-white tracking-tight">Payment QR</h3>
                                        <p className="text-zinc-400 text-sm max-w-[240px] mx-auto leading-relaxed">
                                            Your QR code will appear here after generation.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="qr-code"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <div className="p-10 bg-white rounded-[3.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.4)] mb-10 transform hover:scale-[1.03] transition-transform duration-500 relative">
                                        <QRCodeSVG value={qrData} size={200} level="H" includeMargin={false} />
                                        {/* Security frame */}
                                        <div className="absolute inset-4 border-2 border-emerald-500/5 rounded-[2.5rem] pointer-events-none" />
                                    </div>

                                    <div className="space-y-6 text-center">
                                        <div className="inline-flex items-center gap-3 bg-emerald-500/5 px-6 py-3 rounded-2xl border border-emerald-500/10">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500">Live Broadcast</span>
                                        </div>
                                        <p className="text-zinc-700 text-[8px] font-black uppercase tracking-[0.4em]">
                                            Secure end-to-end payload relay
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
