"use client";

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';

import { API_URL } from '@/lib/api';

export default function Receive() {
    const [amount, setAmount] = useState('');
    const [qrData, setQrData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const navigate = useNavigate();

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

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/wallet/qr/create`, {
                amount: parseFloat(amount),
                referenceId: 'Payment Request'
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
        <AppLayout title="Receive INR" subtitle="Generate a security token to receive INR from another user.">
            <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-700 p-4 lg:p-12">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-24 items-start animate-in fade-in slide-in-from-bottom-2 duration-700">

                    {/* Left Column: Form & Actions */}
                    <div className="space-y-14 relative p-8 lg:p-12 bg-[#0c0c0e]/50 backdrop-blur-xl border border-zinc-400/10 rounded-[2.5rem] shadow-2xl">
                        <div className="absolute -left-20 top-20 w-80 h-80 bg-violet-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider mb-6 border border-violet-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                Payment Request
                            </div>
                            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Receive Assets</h2>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xs">
                                Generate a unique QR code or payment link to receive funds instantly from any user.
                            </p>
                        </div>

                        {!qrData ? (
                            <motion.form
                                key="entry-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-12"
                                onSubmit={generateQR}
                            >
                                <div className="space-y-12">
                                    <div className="relative group/input">
                                        <Label className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-8 block">Requested Amount</Label>
                                        <div className="flex items-center gap-6 pb-6 border-b border-zinc-800/50 group-focus-within/input:border-violet-500/50 transition-all duration-500">
                                            <span className="text-4xl text-zinc-600 font-bold select-none">₹</span>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="200000"
                                                step="1"
                                                placeholder="0"
                                                className="w-full bg-transparent border-none p-0 text-7xl font-bold tracking-tighter text-white focus:outline-none placeholder:text-zinc-900 tabular-nums"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    disabled={loading}
                                    type="submit"
                                    size="lg"
                                    className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-bold text-sm uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] shadow-2xl"
                                >
                                    {loading ? 'Processing...' : 'Generate QR Code'}
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="qr-result-text"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-12"
                            >
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-6">Active Request</p>
                                    <h2 className="text-7xl font-bold text-white tabular-nums tracking-tighter">₹{parseFloat(amount).toLocaleString()}</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={copyLink}
                                        className="h-14 bg-white/[0.01] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        <Copy size={16} className="mr-3" />
                                        Copy Link
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setQrData(null)}
                                        className="h-14 bg-white/[0.01] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        <RefreshCw size={14} className="mr-3" />
                                        Reset
                                    </Button>
                                </div>
                                <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                    Valid for the next {Math.ceil(timeLeft / 60)} minutes
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column: Visual/QR */}
                    <div className="relative flex flex-col items-center justify-center pt-10">
                        <div className="absolute inset-0 bg-violet-500/[0.05] rounded-full blur-[120px] opacity-30" />

                        <AnimatePresence mode="wait">
                            {!qrData ? (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center space-y-10"
                                >
                                    <div className="h-64 w-64 mx-auto border-2 border-dashed border-zinc-800 rounded-[3rem] flex items-center justify-center p-8 bg-zinc-900/20 backdrop-blur-sm">
                                        <div className="h-full w-full bg-zinc-800/50 rounded-[1.5rem] flex items-center justify-center">
                                            <Share2 size={40} className="text-zinc-700" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-white">Secure Receiving</h3>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                                            Your QR code will be generated here once you enter an amount.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="qr-code"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="flex flex-col items-center w-full max-w-sm"
                                >
                                    <div className="p-8 bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(255,255,255,0.05)] mb-10 transform hover:scale-[1.02] transition-transform duration-500">
                                        <QRCodeSVG value={qrData} size={220} level="H" includeMargin={false} />
                                    </div>

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="flex items-center gap-3 text-violet-400 bg-violet-950/30 px-6 py-3 rounded-2xl border border-violet-500/20 backdrop-blur-md">
                                            <div className="h-2 w-2 bg-violet-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                                            <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Awaiting Payment</span>
                                            <div className="w-[1px] h-3 bg-violet-500/20 mx-1" />
                                            <span className="text-[11px] font-mono font-bold">{formatTime(timeLeft)}</span>
                                        </div>

                                        <div className="flex -space-x-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-8 w-8 rounded-full border-2 border-[#08090b] bg-zinc-800" />
                                            ))}
                                            <div className="h-8 w-8 rounded-full border-2 border-[#08090b] bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                8k+
                                            </div>
                                        </div>
                                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                                            Trusted by merchants worldwide
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
