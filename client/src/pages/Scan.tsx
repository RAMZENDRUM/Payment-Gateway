import React, { useState, useEffect, useRef } from 'react';
import Loader from '@/components/Loader';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Image as ImageIcon, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';

import { API_URL } from '@/lib/api';

interface ScanResult {
    token: string;
    receiverId: string; // This is the UUID
    receiverUpiId: string; // The @zenwallet ID
    receiverName: string;
    amount: number;
    referenceId?: string;
    callbackUrl?: string;
}

export default function Scan() {
    const { user } = useAuth();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle');
    const navigate = useNavigate();
    const scannerRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                receiverUpiId: 'merchant@zenwallet',
                receiverName: 'Apex Electronics',
                amount: 499.00,
                referenceId: 'INV-2026-001',
                callbackUrl: '/dashboard'
            });
            setStatus('confirming');
            setIsScanning(false);
            return;
        }
        try {
            const res = await axios.get(`${API_URL}/wallet/qr/details/${token}`);
            setScanResult({
                token,
                receiverId: res.data.receiver_id,
                receiverUpiId: res.data.receiver_upi_id || res.data.receiver_id, // Fallback if missing
                receiverName: res.data.receiver_name,
                amount: parseFloat(res.data.amount),
                referenceId: res.data.reference_id,
                callbackUrl: res.data.callback_url
            });
            setStatus('confirming');
            setIsScanning(false);
        } catch (err) {
            toast.error('Invalid or expired QR code');
        }
    };

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;
        const readerElement = document.getElementById('reader');

        if (isScanning && status === 'idle' && !window.location.search.includes('token') && readerElement) {
            scanner = new Html5Qrcode('reader');
            scannerRef.current = scanner;

            const startScanner = async () => {
                try {
                    await scanner?.start(
                        { facingMode: "environment" },
                        {
                            fps: 60, // Maximum frame rate for fluidity
                            qrbox: (viewfinderWidth, viewfinderHeight) => {
                                // Large responsive scan area for easier capture
                                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                                const size = Math.floor(minEdge * 0.8);
                                return { width: size, height: size };
                            },
                            aspectRatio: 1.0,
                            experimentalFeatures: {
                                useBarCodeDetectorIfSupported: true // Ultra-fast hardware scanning
                            },
                            videoConstraints: {
                                facingMode: "environment",
                                focusMode: { ideal: "continuous" },
                                whiteBalanceMode: { ideal: "continuous" },
                                width: { ideal: 1920 }, // High-res for sharper edges
                                height: { ideal: 1080 }
                            } as any
                        },
                        onScanSuccess,
                        onScanError
                    );
                } catch (err) {
                    console.error("Failed to start scanner:", err);
                    setIsScanning(false);
                }
            };

            startScanner();

            return () => {
                if (scanner) {
                    if (scanner.isScanning) {
                        scanner.stop().then(() => {
                            scanner?.clear();
                        }).catch(err => console.error('Failed to stop scanner', err));
                    } else {
                        try {
                            scanner.clear();
                        } catch (e) { }
                    }
                }
            };
        }
    }, [isScanning, status]);

    function onScanSuccess(result: string) {
        console.log("🔍 Scan hit:", result);
        // 1. Check for URL format
        if (result.startsWith('http')) {
            // Check for internal payment URL
            if (result.includes('/scan?token=')) {
                const token = result.split('token=')[1]?.split('&')[0];
                if (token) {
                    fetchPaymentDetails(token);
                    return;
                }
            }

            try {
                const url = new URL(result);
                const to = url.searchParams.get('to');
                if (to) {
                    navigate(`/send?to=${to}`, { replace: true });
                    return;
                }
            } catch (e) { }
        }

        // 2. Try to parse as JSON
        try {
            const data = JSON.parse(result);
            if (data.token) {
                fetchPaymentDetails(data.token);
                return;
            }
            if (data.upiId) {
                navigate('/send', { state: { receiverId: data.upiId }, replace: true });
                return;
            }
        } catch (err) { }

        // 3. Check for raw UPI ID
        if (result.includes('@')) {
            navigate('/send', { state: { receiverId: result.trim() }, replace: true });
            return;
        }

        // 4. Default to payment token
        fetchPaymentDetails(result);
    }

    function onScanError(err: any) {
        // console.warn(err);
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const html5QrCode = new Html5Qrcode("file-scanner");

        try {
            const result = await html5QrCode.scanFile(file, true);
            onScanSuccess(result);
        } catch (err) {
            toast.error("No QR code found in this image");
            console.error(err);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
        <div className="min-h-screen w-full bg-zinc-950 text-white p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Scan & Pay</h1>
                            <p className="text-zinc-500 text-xs font-medium">Secure Payment Gateway</p>
                        </div>
                    </div>
                    {user && (
                        <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                            {user.full_name?.charAt(0)}
                        </div>
                    )}
                </header>

                <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                key="scanner"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full"
                            >
                                <div className="relative group">
                                    <div id="reader" className={`overflow-hidden rounded-[2.5rem] bg-[#0c0c0e] backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>div]:hidden transition-all duration-500 ${isScanning ? 'opacity-100 min-h-[300px]' : 'opacity-0 h-0 overflow-hidden'}`}>
                                    </div>
                                    {!isScanning && (
                                        <div className="flex flex-col items-center justify-center min-h-[350px] bg-zinc-900/30 rounded-[2.5rem] border border-white/5 p-8">
                                            <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6 animate-pulse">
                                                <Wallet size={32} />
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">Ready to Scan</h3>
                                            <p className="text-center text-zinc-500 text-sm max-w-[200px]">Scan any ZenWallet or standard UPI QR code to pay instantly.</p>
                                        </div>
                                    )}
                                </div>

                                <div id="file-scanner" className="hidden"></div>

                                <div className="mt-8 flex flex-col gap-4 w-full px-4">
                                    <Button
                                        onClick={() => setIsScanning(!isScanning)}
                                        className={`w-full h-14 rounded-2xl font-bold transition-all ${isScanning ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white text-black hover:bg-zinc-200'}`}
                                    >
                                        {isScanning ? 'Stop Camera' : 'Scan QR Code'}
                                    </Button>

                                    <div className="flex items-center gap-4 w-full">
                                        <div className="h-px bg-white/[0.05] flex-1" />
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">OR</span>
                                        <div className="h-px bg-white/[0.05] flex-1" />
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />

                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={loading}
                                        className="w-full bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 h-14 rounded-2xl flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                                        <span className="text-xs font-bold uppercase tracking-widest">Upload from Gallery</span>
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {status === 'confirming' && scanResult && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full bg-[#0c0c0e] border border-white/5 rounded-[2rem] p-6 shadow-2xl shadow-indigo-500/10"
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-full mb-4">
                                        <ShieldCheck className="text-indigo-500 w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Confirm Payment</h2>
                                    <p className="text-zinc-500 text-sm mt-1">Review the transaction details below</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Amount Card */}
                                    <div className="bg-zinc-900/50 rounded-2xl p-6 text-center border border-white/5">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Amount</p>
                                        <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                                            <span className="text-3xl font-bold text-zinc-500 align-top mr-1">₹</span>
                                            {scanResult.amount.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Transaction Flow */}
                                    <div className="relative bg-zinc-900/30 rounded-2xl p-5 border border-white/5">
                                        {/* From */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border border-white/5">
                                                {user?.full_name?.charAt(0) || 'You'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Paying From</p>
                                                <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                                                <p className="text-[10px] font-mono text-zinc-500 truncate">{user?.upi_id || user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="py-4 flex justify-center">
                                            <div className="bg-zinc-800 p-1.5 rounded-full border border-zinc-700">
                                                <ArrowRight className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        </div>

                                        {/* To */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                                {scanResult.receiverName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-indigo-400/70 uppercase tracking-tight">Paying To</p>
                                                <p className="text-sm font-semibold text-white truncate">{scanResult.receiverName}</p>
                                                <p className="text-[10px] font-mono text-indigo-300/60 truncate">{scanResult.receiverUpiId}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={handlePayment}
                                            disabled={loading}
                                            className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-extrabold text-lg rounded-2xl shadow-xl shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : 'Pay Now'}
                                        </Button>
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="w-full mt-4 py-3 text-xs font-bold text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                                        >
                                            Cancel Transaction
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
                                className="w-full text-center"
                            >
                                <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
                                    <CheckCircle2 size={42} className="text-black" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Payment Sent!</h2>
                                <p className="text-zinc-500 font-medium mb-12">
                                    Successfully transferred <span className="text-white font-bold">₹{scanResult.amount.toLocaleString()}</span> to <span className="text-white font-bold">{scanResult.receiverName}</span>.
                                </p>

                                {scanResult.callbackUrl ? (
                                    <div className="space-y-4">
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Redirecting to merchant...</p>
                                        <Button
                                            onClick={() => {
                                                const separator = scanResult.callbackUrl?.includes('?') ? '&' : '?';
                                                window.location.href = `${scanResult.callbackUrl}${separator}status=success&token=${scanResult.token}`;
                                            }}
                                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl"
                                        >
                                            Return to Merchant
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full h-14 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700"
                                    >
                                        Go to Dashboard
                                    </Button>
                                )}
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full text-center"
                            >
                                <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <XCircle size={42} className="text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Transaction Failed</h2>
                                <p className="text-zinc-500 text-sm mb-8">We couldn't process your payment at this time.</p>
                                <Button
                                    onClick={() => setStatus('idle')}
                                    className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200"
                                >
                                    Try Again
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
