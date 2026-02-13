"use client";

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Shield,
    Lock,
    User,
    Mail,
    CreditCard,
    CheckCircle2,
    Copy,
    RefreshCw,
    Sparkles,
    Zap,
    Fingerprint,
    Eye,
    EyeOff,
    Terminal,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { useWalletStats } from '@/hooks/useWalletStats';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlippableCreditCard } from '@/components/ui/credit-debit-card';
import axios from 'axios';
import toast from 'react-hot-toast';

import { API_URL } from '@/lib/api';

export default function Profile() {
    const { user, fetchUser } = useAuth();
    const { totalSpent } = useWalletStats();
    const [isRevealed, setIsRevealed] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/verify-password`, { password });
            setIsRevealed(true);
            setShowAuthModal(false);
            setPassword('');
            toast.success('Identity Verified');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Access Denied');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} Copied`);
    };

    return (
        <AppLayout title="My Identity" subtitle="Manage your cryptographic profile.">
            <div className="max-w-7xl mx-auto p-6 lg:p-10 animate-in fade-in duration-700">
                <div className="grid grid-cols-12 gap-y-12 lg:gap-0 items-start">

                    {/* LEFT BLOCK: Identity, Asset ID, Security Grid (Cols 1-7) */}
                    <div className="col-span-12 lg:col-span-7 space-y-12">
                        {/* 1. Identity Header */}
                        <div className="flex items-center gap-6 p-2">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-3xl bg-muted border border-border/10 flex items-center justify-center text-3xl font-black text-foreground shadow-sm">
                                    {user?.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 p-2 bg-card border border-border/40 rounded-xl text-violet-500 shadow-xl">
                                    <Fingerprint size={18} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">{user?.full_name}</h2>
                                <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                                    <Mail size={14} className="text-violet-500/30" />
                                    {user?.email}
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/5 text-emerald-500 text-[10px] font-bold mt-1 uppercase tracking-widest">
                                    <CheckCircle2 size={10} />
                                    Verified Member
                                </div>
                            </div>
                        </div>

                        {/* 2. Asset ID Card */}
                        <div className="dashboard-card border border-border/40 shadow-sm p-8 relative overflow-hidden group bg-card/10 backdrop-blur-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] transition-opacity pointer-events-none">
                                <Zap size={80} className="text-violet-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4 opacity-70">Official Asset Handle</p>
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                                        {user?.upi_id || 'Connecting...'}
                                    </h3>
                                    <button
                                        onClick={() => copyToClipboard(user?.upi_id || '', 'ID')}
                                        className="p-3 bg-muted border border-border/10 rounded-2xl text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <Copy size={18} />
                                    </button>
                                </div>
                                <div className="mt-8 flex items-center gap-2 text-zinc-500 font-medium text-[10px] italic">
                                    <div className="h-1 w-1 bg-violet-500/40 rounded-full" />
                                    Unique cryptographic identification string
                                </div>
                            </div>
                        </div>

                        {/* 3. Security Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="dashboard-card border border-border/40 shadow-sm p-6 flex items-start gap-4 hover:bg-muted/40 transition-colors bg-card/5 backdrop-blur-sm rounded-3xl">
                                <div className="p-3 bg-muted border border-border/10 rounded-2xl text-muted-foreground shadow-sm">
                                    <Shield size={18} />
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.15em] mb-1.5">Cold Storage</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed font-bold italic opacity-70">Encrypted offline management.</p>
                                </div>
                            </div>
                            <div className="dashboard-card border border-border/40 shadow-sm p-6 flex items-start gap-4 hover:bg-muted/40 transition-colors bg-card/5 backdrop-blur-sm rounded-3xl">
                                <div className="p-3 bg-muted border border-border/10 rounded-2xl text-muted-foreground shadow-sm">
                                    <Lock size={18} />
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.15em] mb-1.5">Identity Protocol</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed font-bold italic opacity-70">AES-256 secure shielding.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT BLOCK (QR Node, Virtual Card) */}
                    <div className="col-span-12 lg:col-span-4 lg:col-start-9 space-y-12">
                        {/* 4. QR Node */}
                        <div className="dashboard-card border-none shadow-none p-8 flex flex-col items-center bg-white/[0.01] max-w-sm ml-auto">
                            <div className="p-4 bg-white rounded-2xl">
                                {user?.upi_id ? (
                                    <QRCodeSVG value={`${window.location.origin}/send?to=${user.upi_id}`} size={120} level="H" />
                                ) : (
                                    <div className="w-[120px] h-[120px] flex items-center justify-center bg-zinc-50 rounded-xl">
                                        <RefreshCw size={24} className="text-zinc-200 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest mb-1">SECURE NODE</p>
                                <p className="text-[10px] text-zinc-500 font-medium leading-tight">Identification access key</p>
                            </div>
                        </div>

                        {/* 5. Virtual Card */}
                        <div className="flex justify-end">
                            <div
                                className="relative cursor-pointer group active:scale-95 transition-all duration-500"
                                onClick={() => !isRevealed && setShowAuthModal(true)}
                            >
                                <FlippableCreditCard
                                    id={isRevealed ? "virtual-card" : "virtual-card-locked"}
                                    className="scale-95 xl:scale-100 transition-all duration-700"
                                    cardholderName={user?.full_name || 'VALUED MEMBER'}
                                    cardNumber={isRevealed && user?.virtualCard?.cardNumber
                                        ? user.virtualCard.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                                        : '•••• •••• •••• ••••'}
                                    expiryDate={isRevealed && user?.virtualCard ? `${user.virtualCard.expiryMonth}/${user.virtualCard.expiryYear.slice(-2)}` : '••/••'}
                                    cvv={isRevealed && user?.virtualCard?.cvv || '•••'}
                                    spending={totalSpent}
                                />

                                {!isRevealed && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                        <div className="pointer-events-auto">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAuthModal(true);
                                                }}
                                                className="p-4 text-white/20 hover:text-white transition-all duration-300 transform hover:scale-110 bg-black/40 backdrop-blur-sm rounded-full"
                                            >
                                                <Eye size={24} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => !loading && setShowAuthModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2rem] p-8 shadow-2xl"
                        >
                            <div className="space-y-6 text-center">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Verify Identity</h3>
                                    <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase opacity-70">Security confirmation required</p>
                                </div>

                                <form onSubmit={handleVerify} className="flex gap-3">
                                    <div className="relative flex-1 group/modal-input">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/modal-input:text-primary transition-colors">
                                            <Lock size={16} />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter security PIN..."
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoFocus
                                                className="h-12 pl-10 pr-10 bg-muted/40 border-border/50 text-foreground text-sm font-bold rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground/60 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl flex-shrink-0 active:scale-95 transition-all p-0 border border-primary/10 shadow-lg shadow-primary/20"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <ArrowRight size={18} strokeWidth={2.5} />
                                        )}
                                    </Button>
                                </form>
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground font-black pt-2 transition-colors uppercase tracking-[0.2em] opacity-60"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
