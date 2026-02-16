import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PinModalProps {
    isOpen: boolean;
    onVerify: (pin: string) => void;
    onCancel: () => void;
    amount?: number;
    title?: string;
    description?: string;
}

export const PinModal = ({ isOpen, onVerify, onCancel, amount, title, description }: PinModalProps) => {
    const [pin, setPin] = useState('');
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const [forgotLoading, setForgotLoading] = useState(false);

    // Auto-focus the hidden input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => hiddenInputRef.current?.focus(), 100);
            setPin('');
        }
    }, [isOpen]);

    const handleForgotPin = async () => {
        setForgotLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-pin`);
            toast.success('Security OTP sent to email');
            onCancel();
        } catch (err) {
            toast.error('Failed to initiate recovery');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 6) {
            setPin(val);
            if (val.length === 6) {
                // Submit after a small delay for visual feedback
                setTimeout(() => {
                    onVerify(val);
                    setPin('');
                }, 300);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="bg-[#08080a] border border-white/10 shadow-2xl max-w-sm p-0 overflow-hidden rounded-[2.5rem] outline-none">
                <div className="p-8 text-center space-y-6 relative">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/5">
                            <Fingerprint size={36} className="stroke-[1.5]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{title || 'Authorization'}</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">Security Payload Confirmation</p>
                        </div>
                    </div>

                    <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[240px] mx-auto italic">
                        {description || (amount ? `Authorize settlement of ₹${amount.toLocaleString()}.` : 'Identity verification required.')}
                    </p>

                    {/* PIN Boxes Area */}
                    <div className="relative pt-4 pb-2" onClick={() => hiddenInputRef.current?.focus()}>
                        <input
                            ref={hiddenInputRef}
                            type="tel"
                            inputMode="numeric"
                            autoFocus
                            value={pin}
                            onChange={handleInputChange}
                            onBlur={() => isOpen && hiddenInputRef.current?.focus()}
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
                                        className={`w-11 h-14 bg-white/[0.03] border-2 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${digit ? 'text-white' : 'text-zinc-800'}`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {digit ? (
                                                <motion.div
                                                    key="dot"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
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

                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            variant="ghost"
                            className="h-10 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/5 rounded-xl transition-all"
                            onClick={handleForgotPin}
                            disabled={forgotLoading}
                        >
                            {forgotLoading ? 'Establishing Uplink...' : 'Recovery Protocol (Forgot PIN)'}
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-10 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white rounded-xl transition-all"
                            onClick={onCancel}
                        >
                            Decline Session
                        </Button>
                    </div>
                </div>

                {/* Secure Badge Footer */}
                <div className="bg-zinc-950/50 py-3 flex items-center justify-center gap-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 opacity-30">
                        <Lock size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">Encrypted Input</span>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};
