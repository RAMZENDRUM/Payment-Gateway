import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    CheckCircle2, XCircle, Loader2, LogOut, ChevronRight,
    Scan as ScanIcon, Upload, ShieldCheck, Wallet,
    Shield, Lock, CreditCard, ChevronLeft, Info, HelpCircle,
    ArrowRight, Fingerprint, Eye, EyeOff, User
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { PinModal } from '@/components/ui/PinModal';

import { API_URL } from '@/lib/api';

interface ScanResult {
    token: string;
    receiverId: string;
    receiverUpiId: string;
    receiverName: string;
    amount: number;
    taxName?: string;
    taxPercentage?: number;
    taxAmount?: number;
    feesAmount?: number;
    referenceId?: string;
    callbackUrl?: string;
}

const Slider = ({ onComplete, disabled }: { onComplete: () => void, disabled: boolean }) => {
    const x = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxDrag, setMaxDrag] = useState(200);
    const [isSliding, setIsSliding] = useState(false);

    useEffect(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const handleWidth = 64; // w-16
            const padding = 16; // p-2 is 8px each side
            setMaxDrag(containerWidth - handleWidth - padding);
        }
    }, []);

    const background = useTransform(x, [0, maxDrag], ["rgba(16, 185, 129, 0.05)", "rgba(16, 185, 129, 0.4)"]);
    const progress = useTransform(x, [0, maxDrag], [0, 1]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-20 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden p-2 select-none backdrop-blur-3xl"
        >
            {/* Dynamic Background Track */}
            <motion.div
                style={{ background, width: useTransform(x, v => v + 64) }}
                className="absolute inset-y-0 left-0 bg-emerald-500/20 pointer-events-none rounded-full"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.span
                    style={{ opacity: useTransform(x, [0, maxDrag * 0.5], [0.4, 0]) }}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500"
                >
                    Slide to Confirm
                </motion.span>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0.05}
                dragMomentum={false}
                style={{ x }}
                onDragStart={() => setIsSliding(true)}
                onDragEnd={(_, info) => {
                    setIsSliding(false);
                    if (info.offset.x > (maxDrag * 0.7) || x.get() > (maxDrag * 0.8)) {
                        animate(x, maxDrag, { type: 'spring', stiffness: 300, damping: 30 });
                        onComplete();
                    } else {
                        animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
                    }
                }}
                className={`relative z-10 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_40px_rgba(16,185,129,0.3)] touch-none select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <div className="flex items-center justify-center">
                    <ArrowRight size={24} className="text-black stroke-[3]" />
                </div>
            </motion.div>
        </div>
    );
};

export default function Scan() {
    const { user, logout, fetchUser } = useAuth();
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'confirming' | 'approving' | 'success' | 'error' | 'expired' | 'scanning'>('idle');
    const [showPinModal, setShowPinModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Scanner state
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        let timer: any;
        if (status === 'confirming' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && status === 'confirming') {
            setStatus('expired');
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        if (token && status === 'idle') {
            fetchPaymentDetails(token);
        } else if (!token && status === 'idle') {
            // No token, show scanner
            setStatus('scanning');
        }
    }, [location.search, status]);

    const formatCurrency = (amt: number = 0) => amt.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        // Handle URL or raw token
        try {
            let token = decodedText;
            if (decodedText.includes('token=')) {
                const url = new URL(decodedText);
                token = url.searchParams.get('token') || decodedText;
            }
            // Stop scanning and fetch details
            setStatus('idle'); // Reset to trigger fetch
            navigate(`/scan?token=${token}`, { replace: true });
        } catch (e) {
            console.error("Scan Error", e);
            toast.error("Invalid QR Code format");
        }
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    // Initialize scanner
    // Initialize scanner
    // Scanner ref to ensure instance is tracked across renders/timeouts
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        let timeoutId: any;

        const initScanner = () => {
            // Check if element exists
            const element = document.getElementById('reader');
            if (!element) {
                // Retry if element not found yet
                timeoutId = setTimeout(initScanner, 100);
                return;
            }

            // Only initialize if status is scanning and no scanner exists
            if (status === 'scanning' && !scannerRef.current) {
                try {
                    const scanner = new Html5QrcodeScanner(
                        "reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        /* verbose= */ false
                    );
                    scannerRef.current = scanner;
                    scanner.render(onScanSuccess, onScanFailure);
                } catch (e) {
                    console.error("Scanner Init Error", e);
                }
            }
        };

        if (status === 'scanning') {
            // Tiny delay to ensure DOM is ready after status change
            timeoutId = setTimeout(initScanner, 100);
        }

        // Cleanup: Clear timeout and stop scanner
        return () => {
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, [status]);


    const fetchPaymentDetails = async (token: string) => {
        if (token === 'demo') {
            setScanResult({
                token: 'demo', receiverId: 'r1', receiverUpiId: 'merch@zen', receiverName: 'Zenith Global',
                amount: 315.40, taxName: 'GST', taxPercentage: 18, taxAmount: 48.11, feesAmount: 5.50,
                referenceId: 'DEMO-RID-123', callbackUrl: '/dashboard'
            });
            setStatus('confirming');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/wallet/qr/details/${token}`);
            setScanResult({
                token, receiverId: res.data.receiver_id, receiverUpiId: res.data.receiver_upi_id,
                receiverName: res.data.receiver_name, amount: parseFloat(res.data.amount),
                taxName: res.data.tax_name, taxPercentage: res.data.tax_percentage,
                taxAmount: res.data.tax_amount, feesAmount: res.data.fees_amount,
                referenceId: res.data.reference_id, callbackUrl: res.data.callback_url
            });
            setStatus('confirming');
        } catch (err) {
            toast.error('Invalid or expired QR code');
            setStatus('scanning'); // Go back to scanning on error
            navigate('/scan', { replace: true });
        } finally { setLoading(false); }
    };

    const handleAuthorize = async (pin: string) => {
        if (!scanResult) return;
        setLoading(true);
        setShowPinModal(false);
        try {
            if (scanResult.token !== 'demo') {
                await axios.post(`${API_URL}/wallet/qr/fulfill`, { token: scanResult.token, pin });
            } else {
                await new Promise(r => setTimeout(r, 1500));
            }
            setStatus('success');
            fetchUser();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authorization failed');
            // setStatus('error'); // Keep user on confirming page to retry? 
            // Better to show toast and stay or go to error.
            // Let's stay on confirm page to retry PIN if it was wrong PIN.
            // But if it was "Expired" error, we should go to error state.
            if (err.response?.data?.message?.includes('expired') || err.response?.data?.message?.includes('used')) {
                setStatus('error');
            }
        } finally { setLoading(false); }
    };

    const handleCancel = () => {
        if (scanResult?.callbackUrl) {
            const sep = scanResult.callbackUrl.includes('?') ? '&' : '?';
            window.location.href = `${scanResult.callbackUrl}${sep}status=cancelled&token=${scanResult.token}`;
        } else {
            navigate('/dashboard');
        }
    };

    const handleSuccessRedirect = () => {
        if (scanResult?.callbackUrl) {
            const sep = scanResult.callbackUrl.includes('?') ? '&' : '?';
            window.location.href = `${scanResult.callbackUrl}${sep}status=success&token=${scanResult.token}`;
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#f4f4f5] flex flex-col font-sans lg:overflow-hidden select-none">
            {/* Header */}
            <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-black">Z</div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">ZenWallet Gateway</span>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 rounded-full flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live Secure</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-xl z-10">
                    <AnimatePresence mode="wait">
                        {status === 'scanning' && (
                            <motion.div
                                key="scanner"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0b0b0d] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center"
                            >
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Scan QR Code</h2>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-8">Align QR code within the frame</p>

                                <div className="rounded-2xl overflow-hidden bg-black border border-white/10 relative min-h-[350px] w-full">
                                    <div id="reader" className="w-full h-full min-h-[350px]"></div>
                                </div>

                                <Button onClick={() => navigate('/dashboard')} variant="ghost" className="mt-8 text-zinc-500 hover:text-white uppercase text-[10px] tracking-widest font-black">
                                    Cancel & Return
                                </Button>
                            </motion.div>
                        )}

                        {status === 'confirming' && scanResult && (
                            <motion.div
                                key="confirm-pane"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                className="bg-[#0b0b0d] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                            >
                                {/* Transaction Flow: From -> To */}
                                <div className="p-8 pb-0">
                                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-3xl p-5 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
                                                <User size={20} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Sender / You</p>
                                                <p className="text-sm font-bold text-white tracking-tight leading-none">{user?.full_name}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1 opacity-20">
                                            <ArrowRight size={14} />
                                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                        </div>

                                        <div className="flex items-center gap-3 text-right">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Recipient</p>
                                                <p className="text-sm font-bold text-emerald-500 tracking-tight leading-none">{scanResult.receiverName}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-lg">
                                                {scanResult.receiverName.charAt(0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="px-8 pb-8 space-y-6">
                                    <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-3xl p-6">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Base Amount</span>
                                            <span className="text-xs font-bold text-white">₹{formatCurrency(scanResult.amount - (scanResult.taxAmount || 0) - (scanResult.feesAmount || 0))}</span>
                                        </div>

                                        <AnimatePresence>
                                            {(scanResult.taxAmount || scanResult.feesAmount) && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                                    {scanResult.feesAmount && scanResult.feesAmount > 0 && (
                                                        <div className="flex justify-between items-center px-1 pt-4 border-t border-white/5">
                                                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Convenience Fee</span>
                                                            <span className="text-xs font-bold text-white">₹{formatCurrency(scanResult.feesAmount)}</span>
                                                        </div>
                                                    )}
                                                    {scanResult.taxAmount && scanResult.taxAmount > 0 && (
                                                        <div className="flex justify-between items-center px-1 pt-4 border-t border-white/5">
                                                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{scanResult.taxName || 'GST'} ({scanResult.taxPercentage || 0}%)</span>
                                                            <span className="text-xs font-bold text-white">₹{formatCurrency(scanResult.taxAmount)}</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-end px-1">
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Authorized Payable Total</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-5 px-2 flex items-center justify-center bg-zinc-900 border border-white/10 rounded text-[9px] font-black text-zinc-500">INR</div>
                                                    <span className="text-5xl font-black tracking-tighter text-white">₹{formatCurrency(scanResult.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-zinc-600 font-black uppercase mb-1 tracking-widest">Auth Timer</p>
                                                <p className="text-[11px] font-mono font-bold text-emerald-500">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="space-y-6 pt-4">
                                        <Slider onComplete={() => setShowPinModal(true)} disabled={loading} />

                                        <div className="flex items-center justify-between px-2">
                                            <button
                                                onClick={handleCancel}
                                                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-red-500 transition-colors"
                                            >
                                                Cancel Session
                                            </button>
                                            <div className="flex items-center gap-2 opacity-30">
                                                <Shield size={10} className="text-emerald-500" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Protocol Secured</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8"
                            >
                                <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 size={48} className="text-black stroke-[3]" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black tracking-tighter uppercase italic">Success</h2>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Transaction Cleared Automatically</p>
                                </div>
                                <Button onClick={handleSuccessRedirect} className="w-full h-16 bg-white text-black font-black rounded-3xl text-sm uppercase tracking-widest shadow-xl">
                                    Return to Home
                                </Button>
                            </motion.div>
                        )}

                        {status === 'idle' && (
                            <div className="text-center space-y-6">
                                <Loader2 className="animate-spin text-emerald-500 mx-auto" size={40} />
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600">Syncing Node Security...</p>
                            </div>
                        )}

                        {(status === 'error' || status === 'expired') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center space-y-8 p-12 bg-red-500/5 border border-red-500/10 rounded-[3rem]"
                            >
                                <XCircle size={60} className="text-red-500 mx-auto" strokeWidth={1.5} />
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{status === 'expired' ? 'Link Expired' : 'Clearance Refused'}</h2>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-medium italic">
                                        For your safety, transactions must be authorized within 5 minutes. No funds were impacted by this interruption.
                                    </p>
                                </div>
                                <Button onClick={() => navigate('/dashboard')} className="w-full h-14 bg-white text-black font-black rounded-2xl">
                                    Exit Security Window
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <PinModal
                isOpen={showPinModal}
                onVerify={handleAuthorize}
                onCancel={() => setShowPinModal(false)}
                amount={scanResult?.amount || 0}
                title="Secure PIN Authorization"
                description={`Validating settlement of ₹${scanResult?.amount ? formatCurrency(scanResult.amount) : '0'}.`}
            />

            <footer className="h-12 border-t border-white/5 opacity-20 flex items-center justify-center gap-10">
                <span className="text-[8px] font-black uppercase tracking-widest">ISO-27001 CLUSTER</span>
                <span className="text-[8px] font-black uppercase tracking-widest">RSA-4096 ENCRYPTED</span>
            </footer>
        </div>
    );
}

