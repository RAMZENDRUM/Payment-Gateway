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
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.05)_0%,transparent_50%)]">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto text-emerald-500">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight uppercase">Setup PIN</h1>
                    <p className="text-zinc-500 text-sm font-medium">Create your 6-digit Security PIN to authorize future transfers and payments.</p>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <Label className="text-xs uppercase font-semibold tracking-wider text-zinc-500 text-center block">Set 6-Digit Payment PIN</Label>

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
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                                        const digit = pin[idx];
                                        const isActive = pin.length === idx;
                                        return (
                                            <motion.div
                                                key={idx}
                                                animate={isActive ? { borderColor: 'rgba(16, 185, 129, 0.5)', scale: 1.05 } : { borderColor: 'rgba(255, 255, 255, 0.1)', scale: 1 }}
                                                className={`w-11 h-14 bg-black border rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${digit ? 'text-white border-emerald-500/30' : 'text-zinc-800'}`}
                                            >
                                                <AnimatePresence mode="wait">
                                                    {digit ? (
                                                        <motion.div
                                                            key="dot"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                        />
                                                    ) : (
                                                        <motion.div
                                                            key="placeholder"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="w-1 h-3 bg-zinc-800 rounded-full"
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                This PIN is independent of your password. It is required for all payments and withdrawals. Keep it confidential.
                            </p>
                        </div>

                        <Button
                            onClick={handleSetPin}
                            disabled={loading || pin.length < 6}
                            className="w-full h-15 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-xl shadow-emerald-500/10 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Confirm Security PIN'}
                        </Button>
                    </div>
                </div>

                <div className="text-center">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors">
                        Cancel
                    </Button>
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
