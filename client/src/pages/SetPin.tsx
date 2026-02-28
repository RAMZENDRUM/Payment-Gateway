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
        <div className="min-h-screen bg-[#ffffff] text-black flex flex-col items-center justify-center p-6 font-sans tracking-tight">
            <div className="w-full max-w-sm space-y-16 animate-in fade-in duration-700">

                {/* Understated Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-light tracking-[0.1em] text-black/90">
                        SECURITY
                    </h1>
                    <div className="w-12 h-[1px] bg-black/10 mx-auto" />
                </div>

                {/* Minimalist Input Area */}
                <div className="space-y-12">
                    <div className="relative" onClick={() => hiddenInputRef.current?.focus()}>
                        <input
                            ref={hiddenInputRef}
                            type="tel"
                            inputMode="numeric"
                            autoFocus
                            value={pin}
                            onChange={handleInputChange}
                            onBlur={() => hiddenInputRef.current?.focus()}
                            className="absolute opacity-0 pointer-events-none"
                            maxLength={6}
                        />
                        <div className="flex justify-center gap-4">
                            {[0, 1, 2, 3, 4, 5].map((idx) => {
                                const digit = pin[idx];
                                const isActive = pin.length === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-10 h-14 border-b transition-all duration-300 flex items-center justify-center ${isActive ? 'border-black' : digit ? 'border-black/40' : 'border-black/10'
                                            }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {digit ? (
                                                <motion.div
                                                    key="dot"
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="w-1.5 h-1.5 bg-black rounded-full"
                                                />
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Aligned Actions */}
                    <div className="flex flex-col items-center gap-8">
                        <Button
                            onClick={handleSetPin}
                            disabled={loading || pin.length < 6}
                            className="px-12 h-11 bg-black hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-semibold rounded-full text-[11px] uppercase tracking-[0.2em] transition-all duration-200"
                        >
                            {loading ? <Loader2 className="w-4 h-4" /> : 'CONFIRM'}
                        </Button>

                        <button
                            onClick={() => navigate(-1)}
                            className="text-[9px] font-medium text-zinc-400 uppercase tracking-[0.2em] hover:text-black transition-colors"
                        >
                            BACK
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
