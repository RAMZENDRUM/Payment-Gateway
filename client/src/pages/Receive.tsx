"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';

const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

export default function Receive() {
    const [amount, setAmount] = useState('');
    const [qrData, setQrData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const generateQR = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/wallet/qr/create`, {
                amount: parseFloat(amount),
                referenceId: 'Payment Request'
            });
            setQrData(res.data.qrData);
        } catch (err) {
            toast.error('Failed to generate request');
        } finally {
            setLoading(false);
        }
    };

    const copyToken = () => {
        if (qrData) {
            navigator.clipboard.writeText(qrData);
            toast.success('Token copied');
        }
    };

    return (
        <AppLayout title="Receive Coins" subtitle="Generate a security token to receive coins from another user.">
            <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-700 p-4 lg:p-12">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-24 items-center animate-in fade-in slide-in-from-bottom-2 duration-700">

                    {/* Left Column: Form & Actions */}
                    <div className="space-y-12 relative">
                        <div className="absolute -left-20 top-20 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 text-blue-500 text-[11px] font-medium mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                Your UPI QR
                            </div>
                            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Receive Money</h2>
                            <p className="text-zinc-500 text-base font-medium leading-relaxed max-w-sm">
                                Show this QR code to any ZenWallet or UPI user to receive payments instantly.
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
                                <div className="space-y-12 group">
                                    <div className="space-y-6">
                                        <Label className="text-[13px] font-medium text-zinc-500 mb-6 block">Requested Amount</Label>
                                        <div className="relative group">
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
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    disabled={loading}
                                    type="submit"
                                    size="lg"
                                    className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-semibold text-base rounded-2xl transition-all active:scale-95 shadow-2xl"
                                >
                                    {loading ? 'Creating QR...' : 'Generate Pay QR'}
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
                                    <p className="text-[13px] font-medium text-zinc-500 mb-4">Requesting Amount</p>
                                    <h2 className="text-7xl font-bold text-white tabular-nums tracking-tight">₹{parseFloat(amount).toLocaleString()}</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <Button
                                        variant="outline"
                                        onClick={copyToken}
                                        className="h-14 bg-white/[0.02] border-zinc-400/10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl font-semibold text-xs uppercase tracking-widest"
                                    >
                                        <Copy size={16} className="mr-2" />
                                        Copy Link
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setQrData(null)}
                                        className="h-14 bg-white/[0.02] border-zinc-400/10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl font-semibold text-xs uppercase tracking-widest"
                                    >
                                        <RefreshCw size={14} className="mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column: Visual/QR */}
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-blue-500/[0.02] rounded-full blur-3xl opacity-50" />

                        <div className="relative w-full max-w-md aspect-square p-12 flex flex-col items-center justify-center">
                            <AnimatePresence mode="wait">
                                {!qrData ? (
                                    <motion.div
                                        key="placeholder"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center space-y-6 opacity-40"
                                    >
                                        <div className="h-32 w-32 mx-auto border-4 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center">
                                            <div className="h-24 w-24 bg-zinc-800 rounded-xl" />
                                        </div>
                                        <p className="text-sm font-medium">QR Code will appear here</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="qr-code"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center w-full"
                                    >
                                        <div className="p-4 bg-white rounded-3xl shadow-xl shadow-cyan-900/20 mb-8">
                                            <QRCodeSVG value={qrData} size={240} level="H" />
                                        </div>
                                        <div className="flex items-center gap-3 text-cyan-400 bg-cyan-950/30 px-5 py-2.5 rounded-full border border-cyan-500/20">
                                            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse" />
                                            <span className="text-xs font-bold tracking-wide uppercase">Live & Valid</span>
                                            <span className="text-xs font-mono opacity-70">05:00</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
