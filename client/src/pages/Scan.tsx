import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

export default function Scan() {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle', 'confirming', 'success', 'error'
    const navigate = useNavigate();
    const scannerRef = useRef(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && status === 'idle') {
            fetchPaymentDetails(token);
        }
    }, []);

    useEffect(() => {
        if (status === 'success' && scanResult?.callbackUrl) {
            const timer = setTimeout(() => {
                const separator = scanResult.callbackUrl.includes('?') ? '&' : '?';
                window.location.href = `${scanResult.callbackUrl}${separator}status=success&token=${scanResult.token}`;
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, scanResult]);

    const fetchPaymentDetails = async (token) => {
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
            });

            scanner.render(onScanSuccess, onScanError);

            return () => {
                scanner.clear().catch(err => console.error('Failed to clear scanner', err));
            };
        }
    }, [status]);

    function onScanSuccess(result) {
        try {
            const data = JSON.parse(result);
            if (data.token) {
                fetchPaymentDetails(data.token);
            }
        } catch (err) {
            console.error('Invalid QR data', err);
        }
    }

    function onScanError(err) {
        // console.warn(err);
    }

    const handlePayment = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/wallet/qr/fulfill`, {
                token: scanResult.token
            });
            setStatus('success');
            toast.success('Payment successful!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020617] text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Scan & Pay</h1>
                        <p className="text-slate-400 text-sm mt-1">Scan QR code to make payment</p>
                    </div>
                </header>

                <div className="flex flex-col items-center justify-center min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                key="scanner"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full"
                            >
                                <div id="reader" className="overflow-hidden rounded-3xl border-0 bg-slate-900 shadow-2xl"></div>
                                <p className="text-center mt-6 text-slate-400 text-sm">Align QR code within the frame</p>
                            </motion.div>
                        )}

                        {status === 'confirming' && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-10 shadow-2xl"
                            >
                                <h2 className="text-3xl font-bold text-center mb-10">Confirm Payment</h2>

                                <div className="space-y-6 mb-10">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                        <span className="text-slate-400 text-lg">Recipient</span>
                                        <span className="font-semibold text-lg">{scanResult.receiverName || scanResult.receiverId.slice(0, 8) + '...'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                        <span className="text-slate-400 text-lg">Reference</span>
                                        <span className="text-lg">{scanResult.referenceId}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-slate-400 text-lg">Amount</span>
                                        <span className="text-3xl font-bold text-indigo-400">{scanResult.amount} Coins</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Pay Now'}
                                    </button>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 rounded-xl transition-all border border-slate-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-28 h-28 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 size={70} />
                                </div>
                                <h2 className="text-4xl font-bold mb-3">Payment Successful!</h2>
                                <p className="text-slate-400 mb-10 text-lg">{scanResult.amount} Coins sent successfully</p>

                                {scanResult.callbackUrl ? (
                                    <div className="text-center">
                                        <p className="text-sm text-slate-500 mb-4 font-medium">Redirecting you back to merchant...</p>
                                        <button
                                            onClick={() => {
                                                const separator = scanResult.callbackUrl.includes('?') ? '&' : '?';
                                                window.location.href = `${scanResult.callbackUrl}${separator}status=success&token=${scanResult.token}`;
                                            }}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-indigo-600/30"
                                        >
                                            Click here if not redirected
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-indigo-600/30"
                                    >
                                        Back to Dashboard
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-28 h-28 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <XCircle size={70} />
                                </div>
                                <h2 className="text-4xl font-bold mb-3">Payment Failed</h2>
                                <p className="text-slate-400 mb-10 text-lg">Something went wrong with the transaction.</p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-indigo-600/30"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
