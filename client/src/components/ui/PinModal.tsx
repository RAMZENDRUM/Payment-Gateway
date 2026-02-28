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
            <DialogContent className="bg-[#000000] border border-[#1a1a1c] shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-[380px] p-0 overflow-hidden rounded-[2.5rem] outline-none">
                <div className="p-10 text-center space-y-8 relative overflow-hidden">
                    {/* Luxurious background layers */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-[45px] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 bg-[#041d13] border border-[#0a3825] shadow-[0_0_25px_rgba(16,185,129,0.1)] rounded-[1.25rem] flex items-center justify-center mx-auto text-emerald-400"
                        >
                            <Fingerprint size={32} strokeWidth={1.5} />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white tracking-[-0.02em] uppercase">
                                {title || 'Verify PIN'}
                            </h3>
                            <p className="text-[#888888] text-[13px] font-medium leading-relaxed max-w-[260px] mx-auto italic">
                                {description || (amount ? `Authorize settlement of ₹${amount.toLocaleString()}.` : 'Identity verification required.')}
                            </p>
                        </div>
                    </div>

                    {/* PIN Entry Area */}
                    <div className="relative py-2" onClick={() => hiddenInputRef.current?.focus()}>
                        <input
                            ref={hiddenInputRef}
                            type="tel"
                            inputMode="numeric"
                            autoFocus
                            value={pin}
                            onChange={handleInputChange}
                            onBlur={() => isOpen && hiddenInputRef.current?.focus()}
                            className="absolute opacity-0 pointer-events-none w-full h-full"
                            maxLength={6}
                        />
                        <div className="flex justify-center gap-2.5">
                            {[0, 1, 2, 3, 4, 5].map((idx) => {
                                const digit = pin[idx];
                                const isActive = pin.length === idx;
                                return (
                                    <motion.div
                                        key={idx}
                                        animate={isActive ? {
                                            borderColor: 'rgba(52, 211, 153, 0.4)',
                                            backgroundColor: 'rgba(52, 211, 153, 0.03)',
                                            y: -2
                                        } : {
                                            borderColor: 'rgba(255, 255, 255, 0.05)',
                                            backgroundColor: 'rgba(10, 10, 11, 1)',
                                            y: 0
                                        }}
                                        className={`w-11 h-14 border-[1.5px] rounded-[1rem] flex items-center justify-center transition-all ${digit ? 'border-emerald-500/20 bg-[#0a1510]' : ''}`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {digit ? (
                                                <motion.div
                                                    key="dot"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                                                />
                                            ) : (
                                                <motion.div
                                                    key="placeholder"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="w-1.5 h-3.5 bg-[#1a1a1c] rounded-full"
                                                />
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col gap-4 pt-4 relative z-10">
                        <Button
                            variant="ghost"
                            className="h-12 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-500 hover:text-white border border-emerald-500/10 hover:bg-emerald-500/10 rounded-[1.25rem] transition-all duration-300"
                            onClick={handleForgotPin}
                            disabled={forgotLoading}
                        >
                            {forgotLoading ? 'Establishing Uplink...' : 'Recovery Protocol (Forgot PIN)'}
                        </Button>
                        <button
                            className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#555555] hover:text-white transition-colors py-2"
                            onClick={onCancel}
                        >
                            Decline Session
                        </button>
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="bg-[#050506] py-4 flex items-center justify-center gap-3 border-t border-[#1a1a1c]">
                    <div className="flex items-center gap-2 opacity-40">
                        <Lock size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">Cryptographic Security Active</span>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};
