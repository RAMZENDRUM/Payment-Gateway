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
        <div className="min-h-screen bg-[#0E0E10] text-[#F5F5F7] flex flex-col items-center justify-center p-8 selection:bg-[#C6A75E]/30 relative overflow-hidden">
            {/* Subtle vault-like grid/lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#1F1F23] to-transparent" />
                <div className="absolute top-1/2 left-0 w-[1px] h-32 bg-gradient-to-b from-transparent via-[#C6A75E]/10 to-transparent" />
                <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[#C6A75E]/[0.02] blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-[420px] space-y-16 relative z-10">

                {/* 🪪 Heading Section */}
                <div className="space-y-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1 className="text-[28px] font-medium tracking-[0.06em] text-[#F5F5F7] antialiased">
                            Private Access Initialization
                        </h1>
                        <p className="text-[#9A9AA3] text-[13px] tracking-[0.03em] mt-3 font-light leading-relaxed">
                            Create your confidential 6-digit authorization code.
                        </p>
                    </motion.div>
                </div>

                {/* 🏆 New PIN Input Area */}
                <div className="space-y-14">
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

                        <div className="flex justify-between items-end h-20 gap-3 px-1">
                            {[0, 1, 2, 3, 4, 5].map((idx) => {
                                const digit = pin[idx];
                                const isActive = pin.length === idx;

                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-5">
                                        <div className={`w-full relative h-[64px] bg-[#15161A] rounded-[2px] overflow-hidden border transition-all duration-500 ease-out ${isActive ? 'border-[#C6A75E]/40 shadow-[0_0_15px_rgba(198,167,94,0.05)]' : 'border-[#1F1F23]'}`}>
                                            {/* Fill Animation */}
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: digit ? "100%" : "0%" }}
                                                transition={{ duration: 0.18, ease: "easeInOut" }}
                                                className="absolute bottom-0 left-0 w-full bg-[#1A1A1E] border-t border-[#C6A75E]/20"
                                            />

                                            {/* Suble Interior Detail */}
                                            {digit && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#C6A75E]/[0.03] to-transparent pointer-events-none z-10" />
                                            )}
                                        </div>

                                        {/* Interaction Indicator */}
                                        <motion.div
                                            animate={{
                                                scale: digit ? 1.2 : 1,
                                                backgroundColor: digit ? "#C6A75E" : "#2A2A2F",
                                                opacity: digit ? 1 : 0.4
                                            }}
                                            className="w-1 h-1 rounded-full"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ℹ️ Minimalist Info Box */}
                    <div className="space-y-2 border-l-[1.5px] border-[#C6A75E]/30 pl-5 py-0.5">
                        <p className="text-[11px] text-[#9A9AA3] tracking-[0.05em] leading-relaxed uppercase font-medium">
                            This code is required for high-level transactions.
                        </p>
                        <p className="text-[11px] text-[#6B6B73] tracking-[0.05em] leading-relaxed uppercase">
                            It is separate from your login credentials.
                        </p>
                    </div>
                </div>

                {/* 🔘 Private Action Section */}
                <div className="space-y-10 pt-4">
                    <Button
                        onClick={handleSetPin}
                        disabled={loading || pin.length < 6}
                        className="w-full h-[58px] bg-transparent hover:bg-[#C6A75E] border border-[#C6A75E]/40 disabled:border-[#1F1F23] text-[#C6A75E] hover:text-[#0E0E10] disabled:text-[#6B6B73] font-medium tracking-[0.16em] rounded-[2px] uppercase text-[11px] transition-all duration-500 group overflow-hidden active:scale-[0.99] relative"
                    >
                        <span className="relative z-10">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate Private PIN'}
                        </span>
                    </Button>

                    <div className="flex flex-col items-center gap-8">
                        <button className="text-[10px] text-[#6B6B73] tracking-[0.12em] hover:text-[#F5F5F7] transition-colors uppercase font-semibold">
                            Use Face ID instead
                        </button>

                        <div className="w-6 h-[1px] bg-[#1F1F23]" />

                        <button
                            onClick={() => navigate(-1)}
                            className="text-[10px] text-[#6B6B73] tracking-[0.12em] hover:text-[#F5F5F7] transition-colors uppercase font-semibold"
                        >
                            Cancel Initialization
                        </button>
                    </div>
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
