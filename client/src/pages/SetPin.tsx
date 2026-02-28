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
        <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Royal Obsidian & Gold background glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-zinc-900/20 blur-[150px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">

                {/* Header Section */}
                <div className="text-center space-y-5">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
                        className="w-16 h-16 bg-[#1a1408] border border-[#3d2f10] shadow-[0_0_30px_rgba(245,158,11,0.1)] rounded-[1.25rem] flex items-center justify-center mx-auto text-amber-500"
                    >
                        <ShieldCheck strokeWidth={1.5} size={32} />
                    </motion.div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold tracking-[-0.03em] uppercase drop-shadow-sm text-white">
                            Security Enrollment
                        </h1>
                        <p className="text-[#888888] text-[15px] italic max-w-[320px] mx-auto leading-relaxed">
                            Establish your 6-digit cryptographic Payment PIN to authorize transfers and withdrawals.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-[#0a0a0b] border border-[#1a1a1c] shadow-2xl rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="space-y-12 relative z-10">

                        {/* PIN Inputs */}
                        <div className="space-y-6">
                            <Label className="text-[11px] uppercase font-bold tracking-[0.2em] text-[#555555] text-center block">
                                Set New 6-Digit Payment PIN
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
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                                        const digit = pin[idx];
                                        const isActive = pin.length === idx;
                                        return (
                                            <motion.div
                                                key={idx}
                                                animate={isActive ? {
                                                    borderColor: 'rgba(245, 158, 11, 0.4)',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.03)',
                                                    y: -2
                                                } : {
                                                    borderColor: 'rgba(255, 255, 255, 0.03)',
                                                    backgroundColor: 'rgba(5, 5, 5, 1)',
                                                    y: 0
                                                }}
                                                className={`w-12 h-16 sm:w-14 sm:h-16 border-[1.5px] rounded-[1.25rem] flex items-center justify-center transition-all ${digit ? 'border-[#f59e0b]/20 bg-[#141108]' : ''}`}
                                            >
                                                <AnimatePresence mode="wait">
                                                    {digit ? (
                                                        <motion.div
                                                            key="dot"
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                                                        />
                                                    ) : (
                                                        <motion.div
                                                            key="placeholder"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="w-1.5 h-4 bg-[#222222] rounded-full"
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Info Alert */}
                        <div className="p-5 bg-[#141108] border border-[#2e260d] rounded-[1.25rem] flex items-start gap-4">
                            <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-[#888888] font-medium leading-relaxed">
                                This PIN is independent of your account password. It is required for all high-priority financial operations. Keep it confidential.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSetPin}
                            disabled={loading || pin.length < 6}
                            className="w-full h-16 bg-[#d97706] hover:bg-[#f59e0b] disabled:bg-[#1a1a1c] disabled:text-[#444444] text-[#000000] font-black rounded-[1.25rem] shadow-[0_8px_30px_rgba(217,119,6,0.2)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.4)] disabled:shadow-none uppercase tracking-[0.15em] text-[13px] transition-all duration-300 relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : 'Activate Security PIN'}
                            </span>
                        </Button>
                    </div>
                </motion.div>

                {/* Cancel Link */}
                <div className="text-center pt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-[11px] font-bold text-[#666666] uppercase tracking-[0.2em] hover:text-white transition-colors"
                    >
                        Cancel Enrollment
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
