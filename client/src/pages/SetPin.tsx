import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, ArrowRight, Fingerprint, Info } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function SetPin() {
    const { user, fetchUser } = useAuth();
    const [pin, setPin] = useState('');

    useEffect(() => {
        console.log('🛡️ SetPin component mounted');
        console.log('👤 Current User state:', user);
    }, [user]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the hidden input
    useEffect(() => {
        setTimeout(() => hiddenInputRef.current?.focus(), 100);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 6) {
            setPin(val);
        }
    };

    const handleSetPin = async () => {
        if (pin.length < 6) return toast.error('Enter a valid 6-digit PIN');

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/set-pin`, { pin });
            toast.success('Payment PIN established securely');
            await fetchUser();
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to set PIN');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* High-End Futuristic Ambient Flows */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse duration-[10s]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />

            {/* Subtle Grid Pattern for Technical Feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />

            <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in-95 duration-1000 relative z-10">

                {/* Minimalist Header */}
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="relative inline-block"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto text-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.15)] ring-1 ring-white/10">
                            <ShieldCheck strokeWidth={1} size={40} />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="absolute -inset-2 bg-violet-500/10 blur-xl rounded-full -z-10"
                        />
                    </motion.div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                            SECURITY ENROLLMENT
                        </h1>
                        <p className="text-zinc-500 text-[14px] font-medium tracking-tight max-w-[280px] mx-auto leading-relaxed">
                            Initialize your 6-digit cryptographic PIN to secure high-priority vault operations.
                        </p>
                    </div>
                </div>

                {/* Glassmorphic Cyber-Card */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
                    className="relative"
                >
                    {/* Outer Glow for the Card */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] blur-[1px] pointer-events-none" />

                    <div className="bg-[#08080a]/80 border border-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.6)] rounded-[2.5rem] p-10 backdrop-blur-3xl overflow-hidden relative">
                        {/* Internal Scan-line Decoration */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

                        <div className="space-y-12 relative z-10">
                            {/* PIN Matrix Section */}
                            <div className="space-y-8">
                                <Label className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-600 text-center block">
                                    ESTABLISH VAULT ACCESS CODE
                                </Label>

                                <div className="relative" onClick={() => hiddenInputRef.current?.focus()}>
                                    <input
                                        ref={hiddenInputRef}
                                        type="tel"
                                        inputMode="numeric"
                                        autoFocus
                                        value={pin}
                                        onChange={handleInputChange}
                                        onBlur={() => hiddenInputRef.current?.focus()}
                                        className="absolute opacity-0 pointer-events-none w-full h-full"
                                        maxLength={6}
                                    />
                                    <div className="flex justify-center gap-3">
                                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                                            const digit = pin[idx];
                                            const isActive = pin.length === idx;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    animate={isActive ? {
                                                        borderColor: 'rgba(139, 92, 246, 0.4)',
                                                        backgroundColor: 'rgba(139, 92, 246, 0.05)',
                                                        y: -4,
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                                                    } : {
                                                        borderColor: digit ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.02)',
                                                        backgroundColor: 'rgba(5, 5, 5, 0.4)',
                                                        y: 0,
                                                        boxShadow: 'none'
                                                    }}
                                                    className="w-12 h-16 sm:w-14 sm:h-18 border-[1px] rounded-2xl flex items-center justify-center transition-all duration-300"
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {digit ? (
                                                            <motion.div
                                                                key="digit-glow"
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className="w-3 h-3 bg-violet-400 rounded-full shadow-[0_0_15px_rgba(167,139,150,0.8)]"
                                                            />
                                                        ) : (
                                                            <motion.div
                                                                key="idle-placeholder"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 0.3 }}
                                                                className="w-2 h-2 bg-zinc-800 rounded-full"
                                                            />
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Futuristic Tech Alert */}
                            <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex items-center gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <Info size={14} className="text-violet-400 group-hover:animate-bounce" />
                                </div>
                                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed tracking-tight">
                                    This PIN is an independent security layer. Keep it stored in a high-security vault.
                                </p>
                            </div>

                            {/* Ultra-Sleek Action Button */}
                            <Button
                                onClick={handleSetPin}
                                disabled={loading || pin.length < 6}
                                className="w-full h-18 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-700 text-black font-bold rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.05)] hover:shadow-[0_10px_40px_rgba(255,255,255,0.15)] disabled:shadow-none uppercase tracking-[0.2em] text-[12px] transition-all duration-500 relative overflow-hidden active:scale-95"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                        <>
                                            INITIALIZE ACCESS
                                            <ArrowRight size={16} strokeWidth={3} />
                                        </>
                                    )}
                                </span>
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Cancel Secondary Link */}
                <div className="text-center pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.3em] hover:text-white transition-all hover:tracking-[0.4em]"
                    >
                        ABORT ENROLLMENT
                    </button>
                </div>
            </div>
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
