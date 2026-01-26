import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

interface ScanResult {
    token: string;
    receiverId: string;
    receiverName: string;
    amount: number;
    referenceId?: string;
    callbackUrl?: string;
}

export default function Scan() {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle');
    const navigate = useNavigate();
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && status === 'idle') {
            fetchPaymentDetails(token);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'success' && scanResult?.callbackUrl) {
            const timer = setTimeout(() => {
                const separator = scanResult.callbackUrl?.includes('?') ? '&' : '?';
                window.location.href = `${scanResult.callbackUrl}${separator}status=success&token=${scanResult.token}`;
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, scanResult]);

    const fetchPaymentDetails = async (token: string) => {
        if (token === 'demo') {
            setScanResult({
                token: 'demo-token-123',
                receiverId: 'merchant-id-abc',
                receiverName: 'Apex Electronics',
                amount: 499.00,
                referenceId: 'INV-2026-001',
                callbackUrl: '/dashboard'
            });
            setStatus('confirming');
            return;
        }
        try {
            const res = await axios.get(`${API_URL}/wallet/qr/details/${token}`);
            setScanResult({
                token,
                receiverId: res.data.receiver_id,
                receiverName: res.data.receiver_name,
                amount: res.data.amount,
                referenceId: res.data.reference_id,
                callbackUrl: res.data.callback_url
            });
            setStatus('confirming');
        } catch (err) {
            toast.error('Invalid or expired QR code');
        }
    };

    useEffect(() => {
        if (status === 'idle' && !window.location.search.includes('token')) {
            const scanner = new Html5QrcodeScanner('reader', {
                qrbox: { width: 250, height: 250 },
                fps: 10,
            }, false);

            scanner.render(onScanSuccess, onScanError);

            return () => {
                scanner.clear().catch(err => console.error('Failed to clear scanner', err));
            };
        }
    }, [status]);

    function onScanSuccess(result: string) {
        try {
            const data = JSON.parse(result);
            if (data.token) {
                fetchPaymentDetails(data.token);
            }
        } catch (err) {
            console.error('Invalid QR data', err);
        }
    }

    function onScanError(err: any) {
        // console.warn(err);
    }

    const handlePayment = async () => {
        if (!scanResult) return;
        setLoading(true);
        if (scanResult.token === 'demo-token-123') {
            setTimeout(() => {
                setStatus('success');
                toast.success('Demo payment successful!');
                setLoading(false);
            }, 1500);
            return;
        }
        try {
            await axios.post(`${API_URL}/wallet/qr/fulfill`, {
                token: scanResult.token
            });
            setStatus('success');
            toast.success('Payment successful!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment failed');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-white p-4 md:p-8">
            <div className="max-w-xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight">Scan any QR</h1>
                            <p className="text-zinc-500 text-xs font-medium mt-1">ZenWallet, GPay, PhonePe & more</p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col items-center justify-center min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                key="scanner"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full"
                            >
                                <div id="reader" className="overflow-hidden rounded-[2.5rem] bg-[#0c0c0e]/50 backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/[0.02]"></div>
                                <p className="text-center mt-12 text-zinc-500 text-xs font-medium tracking-widest">Center QR code within the frame</p>
                            </motion.div>
                        )}

                        {status === 'confirming' && scanResult && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full space-y-12"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-bold text-white tracking-tight">Review Payment</h2>
                                    <p className="text-base text-zinc-500 font-medium">Please verify the receiver details</p>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[13px] font-medium text-zinc-500">Paying To</span>
                                            <span className="font-semibold text-white text-sm">{scanResult.receiverName || scanResult.receiverId.slice(0, 12)}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[13px] font-medium text-zinc-500">UPI ID</span>
                                            <span className="font-mono text-zinc-400 text-xs uppercase">{scanResult.receiverId}</span>
                                        </div>
                                        <div className="pt-10 border-t border-white/[0.05] flex justify-between items-center">
                                            <span className="text-[13px] font-medium text-zinc-500">Payable Amount</span>
                                            <span className="text-5xl font-bold text-white tabular-nums tracking-tight">₹{scanResult.amount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            onClick={handlePayment}
                                            disabled={loading}
                                            className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-semibold text-base rounded-2xl shadow-2xl active:scale-95 transition-all"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="animate-spin" size={16} />
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                'Proceed to Pay'
                                            )}
                                        </Button>
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="w-full text-center text-xs text-zinc-600 hover:text-white font-medium pt-4 transition-colors uppercase tracking-widest"
                                        >
                                            Cancel Payment
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && scanResult && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center w-full max-w-sm mx-auto"
                            >
                                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/20">
                                    <CheckCircle2 size={32} className="text-black" />
                                </div>
                                <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">Payment Successful</h2>
                                <p className="text-zinc-500 mb-12 text-base font-medium">Transferred <span className="text-white">₹{scanResult.amount.toLocaleString()}</span> successfully.</p>

                                {scanResult.callbackUrl ? (
                                    <div className="text-center space-y-4">
                                        <p className="text-[11px] text-zinc-600 font-medium tracking-tight">Redirecting to origin...</p>
                                        <Button
                                            onClick={() => {
                                                const separator = scanResult.callbackUrl?.includes('?') ? '&' : '?';
                                                window.location.href = `${scanResult.callbackUrl}${separator}status=success&token=${scanResult.token}`;
                                            }}
                                            className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-medium text-sm rounded-2xl shadow-2xl"
                                        >
                                            Return to Origin
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full h-14 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white font-medium text-sm rounded-2xl shadow-2xl"
                                    >
                                        Exit to Dashboard
                                    </Button>
                                )}
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center w-full max-w-sm mx-auto"
                            >
                                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                                    <XCircle size={32} />
                                </div>
                                <h2 className="text-2xl font-medium mb-2 text-white">Transaction Denied</h2>
                                <p className="text-zinc-500 mb-10 text-[15px] font-medium">The cryptographic operation failed.</p>
                                <Button
                                    onClick={() => setStatus('idle')}
                                    className="w-full h-14 bg-zinc-900 border border-white/5 text-white hover:bg-zinc-800 font-medium text-sm rounded-2xl"
                                >
                                    Restart Hardware
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
