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
            <DialogContent className="bg-[#000000] border-none shadow-[0_40px_100px_rgba(0,0,0,0.95)] max-w-[340px] p-0 overflow-hidden rounded-[2.5rem] outline-none">
                <div className="p-12 text-center space-y-12">

                    {/* Minimalist Header */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-light text-white tracking-[0.1em] uppercase">
                            SECURITY
                        </h3>
                        <div className="w-10 h-[1px] bg-white/20 mx-auto" />
                        <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-[0.2em] leading-relaxed px-4">
                            {description || (amount ? `Authorize settlement of ₹${amount.toLocaleString()}` : 'Identity verification')}
                        </p>
                    </div>

                    {/* PIN Entry Area */}
                    <div className="relative" onClick={() => hiddenInputRef.current?.focus()}>
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
                        <div className="flex justify-center gap-4">
                            {[0, 1, 2, 3, 4, 5].map((idx) => {
                                const digit = pin[idx];
                                const isActive = pin.length === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-10 h-14 border-b transition-all duration-300 flex items-center justify-center ${isActive ? 'border-white' : digit ? 'border-white/40' : 'border-white/10'
                                            }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {digit ? (
                                                <motion.div
                                                    key="dot"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-1.5 h-1.5 bg-white rounded-full"
                                                />
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col items-center gap-10">
                        <button
                            className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                            onClick={handleForgotPin}
                            disabled={forgotLoading}
                        >
                            {forgotLoading ? 'TRANSMITTING...' : 'RECOVER PIN'}
                        </button>

                        <div className="space-y-6 w-full">
                            <Button
                                onClick={onCancel}
                                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-full text-[10px] uppercase tracking-[0.2em] transition-all"
                            >
                                CANCEL
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
