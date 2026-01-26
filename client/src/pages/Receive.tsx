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

const API_URL = 'http://localhost:5000/api';

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
        <div className="min-h-screen w-full bg-[#09090b] text-zinc-50 flex flex-col font-sans">
            {/* Desktop Navbar / Breadcrumb */}
            <div className="w-full border-b border-zinc-900 bg-zinc-950/20 px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-2 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <span className="text-sm font-medium text-zinc-400">Wallet</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-sm font-medium text-zinc-100">Receive Coins</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">ZenWallet v1.0</span>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-start py-20 px-6">
                <div className="w-full max-w-[560px]">
                    <div className="mb-10 text-center">
                        <h1 className="text-2xl font-medium tracking-tight">Receive Coins</h1>
                        <p className="text-sm text-zinc-500 mt-2">Generate a security token to receive coins from another user.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!qrData ? (
                            <motion.form
                                key="entry"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                onSubmit={generateQR}
                                className="space-y-12"
                            >
                                {/* Amount Input */}
                                <div className="space-y-4 text-center">
                                    <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Requested Amount</Label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            autoFocus
                                            className="w-full bg-transparent border-none p-0 text-7xl font-medium tabular-nums text-zinc-50 text-center focus:outline-none placeholder:text-zinc-800"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                        <span className="absolute right-0 bottom-3 text-sm font-bold text-zinc-600 tracking-widest">COINS</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-zinc-800 group-focus-within:bg-cyan-600/50 transition-colors" />
                                </div>

                                <div className="flex gap-4 p-5 bg-zinc-900/20 border border-zinc-900/60 rounded-md items-start">
                                    <Info size={18} className="text-cyan-600/60 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-zinc-300">Security Token</p>
                                        <p className="text-[11px] text-zinc-500 leading-normal">
                                            Creating a payment request generates a single-use secure token valid for 5 minutes.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-zinc-950 font-bold text-sm tracking-wide transition-all rounded-md shadow-sm active:scale-[0.99]"
                                >
                                    {loading ? 'Initializing Server...' : 'Generate New Secure Token'}
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.99 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-12 flex flex-col items-center"
                            >
                                {/* QR Container */}
                                <div className="p-8 border border-zinc-900 bg-zinc-950/40 rounded-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="bg-white p-4 rounded-md">
                                        <QRCodeSVG value={qrData} size={220} level="H" />
                                    </div>
                                    <div className="mt-6 flex items-center justify-center gap-2 text-cyan-600/80">
                                        <RefreshCw size={12} className="animate-spin-slow" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Valid for 05:00</span>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600">Pending Receipt</p>
                                    <h2 className="text-4xl font-medium tabular-nums">{parseFloat(amount).toFixed(2)} COINS</h2>
                                </div>

                                <div className="w-full space-y-4 pt-4 border-t border-zinc-900">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={copyToken}
                                            className="h-11 border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all rounded-md text-xs font-semibold"
                                        >
                                            <Copy size={16} className="mr-2" />
                                            Copy Token
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-11 border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all rounded-md text-xs font-semibold"
                                        >
                                            <Share2 size={16} className="mr-2" />
                                            Share Link
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setQrData(null)}
                                        className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-medium"
                                    >
                                        Discard and try again
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
