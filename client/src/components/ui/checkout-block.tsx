"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import {
    Shield,
    Check,
    Lock,
    ShoppingBag,
    HelpCircle,
    History,
    ArrowRight,
    Search,
    ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from '@/lib/api';
import PageLoader from "./page-loader";

interface OrderItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface PaymentDetails {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolder: string;
    upiId: string;
}

export default function Checkout() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [paymentRequest, setPaymentRequest] = useState<any>(null);
    const [selectedTab, setSelectedTab] = useState<'card' | 'upi'>('card');
    const [currentStep, setCurrentStep] = useState<number>(1); // 1: Form, 2: Success
    const [details, setDetails] = useState<PaymentDetails>({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        cardHolder: "",
        upiId: ""
    });

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchDetails = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/external/status/${token}`);
                    setPaymentRequest(res.data);
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to load payment session");
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Mock data if no token
                setPaymentRequest({
                    reference_id: "ORD_DEMO_99",
                    amount: 1500,
                    merchant_name: "TechFlow Solutions",
                    merchant_id: "MT_DEMO"
                });
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, []);

    const validatePayment = () => {
        if (selectedTab === 'card') {
            const raw = details.cardNumber.replace(/\s/g, '');
            if (raw.length !== 16 || !raw.startsWith('0605') || !raw.endsWith('2212')) {
                toast.error("Invalid card. Only ZenWallet Virtual Cards are accepted.");
                return false;
            }
            if (!details.expiryMonth || !details.expiryYear || details.cvv.length < 3) {
                toast.error("Please fill all card details correctly");
                return false;
            }
        } else {
            if (!details.upiId.includes('@')) {
                toast.error("Please enter a valid UPI ID");
                return false;
            }
            if (!details.upiId.endsWith('@zenwallet') && !details.upiId.endsWith('@upi')) {
                toast.error("Currently only accepting @zenwallet and @upi identifiers.");
                return false;
            }
        }
        return true;
    };

    const handlePay = async () => {
        if (!validatePayment()) return;

        setIsProcessing(true);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        try {
            const res = await axios.post(`${API_URL}/external/fulfill-payment`, {
                token: token || 'DEMO_TOKEN',
                paymentMethod: selectedTab.toUpperCase(),
                paymentDetails: {
                    cardNumber: details.cardNumber,
                    cvv: details.cvv,
                    expiryMonth: details.expiryMonth,
                    expiryYear: details.expiryYear,
                    upiId: details.upiId
                }
            });

            if (res.data.success) {
                toast.success("Transaction Finished!");
                setCurrentStep(2);
                const callbackUrl = paymentRequest?.callback_url;
                if (callbackUrl) {
                    setTimeout(() => {
                        window.location.href = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}status=success&txn=${res.data.transactionId}`;
                    }, 4000);
                }
            } else {
                toast.error(res.data.message || "Payment failed");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Transaction Error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="min-h-screen grid place-items-center bg-[#f5f7f8]"><PageLoader /></div>;

    return (
        <section className="min-h-screen w-full bg-[#f5f7f8] font-['Inter'] antialiased text-slate-900 border-none">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 md:px-40 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3 text-[#3396ff]">
                    <div className="size-8">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">ZenWallet</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <HelpCircle size={18} />
                    </button>
                    <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <History size={18} />
                    </button>
                    <div className="bg-[#3396ff]/20 flex items-center justify-center rounded-full size-10 border-2 border-[#3396ff]/10 overflow-hidden">
                        <div className="text-[#3396ff] font-black text-xs">{user?.full_name?.charAt(0) || 'U'}</div>
                    </div>
                </div>
            </header>

            <main className="flex justify-center py-8 md:py-12 px-4 md:px-0">
                <div className="max-w-[1000px] w-full flex flex-col md:flex-row gap-8">

                    {/* Sidebar */}
                    <aside className="w-full md:w-[320px] shrink-0">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-28">
                            <div className="mb-6">
                                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Order Details</h3>
                                <div className="flex flex-col">
                                    <h1 className="text-slate-900 text-xl font-bold">#{paymentRequest?.reference_id || '84291'}</h1>
                                    <p className="text-[#3396ff] text-2xl font-black mt-1">₹{parseFloat(paymentRequest?.amount || 0).toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 font-medium">
                                    <ShoppingBag size={18} className="text-slate-400" />
                                    <span className="text-sm">For: {paymentRequest?.merchant_name || 'ZenPay Merchant'}</span>
                                </div>
                                <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#3396ff]/10 text-[#3396ff] border border-[#3396ff]/20">
                                    <Lock size={18} />
                                    <span className="text-sm font-semibold">Secure Payment</span>
                                </div>
                            </nav>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Shield size={16} className="text-emerald-500" />
                                    <p className="text-[10px] font-medium leading-tight">Secured by ZenWallet 256-bit encryption. PCI-DSS Compliant node.</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Form Area */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        {currentStep === 1 ? (
                            <>
                                <div className="p-8 border-b border-slate-100">
                                    <h2 className="text-2xl font-bold text-slate-900">Complete Payment</h2>
                                    <p className="text-slate-500 text-sm mt-1">Choose your preferred settlement mode</p>
                                </div>

                                {/* Tabs */}
                                <div className="px-8 bg-slate-50/50 flex border-b border-slate-100">
                                    <button
                                        onClick={() => setSelectedTab('card')}
                                        className={`flex items-center gap-2 border-b-2 py-4 px-4 font-bold text-sm transition-all ${selectedTab === 'card' ? 'border-[#3396ff] text-[#3396ff]' : 'border-transparent text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined">credit_card</span>
                                        Card
                                    </button>
                                    <button
                                        onClick={() => setSelectedTab('upi')}
                                        className={`flex items-center gap-2 border-b-2 py-4 px-4 font-bold text-sm transition-all ${selectedTab === 'upi' ? 'border-[#3396ff] text-[#3396ff]' : 'border-transparent text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined">qr_code_2</span>
                                        UPI
                                    </button>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <AnimatePresence mode="wait">
                                        {selectedTab === 'card' ? (
                                            <motion.div
                                                key="card-form"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="space-y-6 max-w-md"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700">Cardholder Name</Label>
                                                    <Input
                                                        value={details.cardHolder}
                                                        onChange={(e) => setDetails({ ...details, cardHolder: e.target.value })}
                                                        placeholder="JOHN DOE"
                                                        className="h-14 bg-slate-50 border-slate-200 text-lg uppercase font-bold text-slate-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700">Card Number</Label>
                                                    <div className="relative">
                                                        <Input
                                                            value={details.cardNumber}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
                                                                setDetails({ ...details, cardNumber: val });
                                                            }}
                                                            placeholder="0605 0000 0000 2212"
                                                            className="h-14 bg-slate-50 border-slate-200 text-lg font-mono font-bold tracking-widest text-[#3396ff]"
                                                        />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded">ZEN</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-400 italic">Only ZenWallet Virtual Cards accepted for this checkout session.</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-semibold text-slate-700">Expiry (MM/YY)</Label>
                                                        <Input
                                                            value={`${details.expiryMonth}${details.expiryMonth ? '/' : ''}${details.expiryYear}`}
                                                            onChange={(e) => {
                                                                const parts = e.target.value.replace(/\//g, '').match(/.{1,2}/g) || [];
                                                                setDetails({ ...details, expiryMonth: parts[0] || "", expiryYear: parts[1] || "" });
                                                            }}
                                                            placeholder="MM/YY"
                                                            className="h-14 bg-slate-50 border-slate-200 text-lg font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-semibold text-slate-700">CVV</Label>
                                                        <Input
                                                            type="password"
                                                            value={details.cvv}
                                                            onChange={(e) => setDetails({ ...details, cvv: e.target.value.slice(0, 4) })}
                                                            placeholder="•••"
                                                            className="h-14 bg-slate-50 border-slate-200 text-lg font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="upi-form"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="space-y-6 max-w-md"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700">UPI ID / VPA</Label>
                                                    <div className="relative group">
                                                        <Input
                                                            value={details.upiId}
                                                            onChange={(e) => setDetails({ ...details, upiId: e.target.value })}
                                                            placeholder="username@zenwallet"
                                                            className="h-14 bg-slate-50 border-slate-200 text-lg font-medium text-slate-900"
                                                        />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                            <span className="text-[10px] font-bold text-[#3396ff] bg-[#3396ff]/10 px-2 py-1 rounded uppercase tracking-tighter">Verified</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-400 text-xs mt-1 italic">
                                                        Example: <span className="text-slate-600 font-medium">8888888888@zenwallet</span> or <span className="text-slate-600 font-medium">yourname@upi</span>
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-4 gap-3">
                                                    {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                                        <div key={app} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer hover:border-[#3396ff]/50 transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mb-1 text-[8px] font-black">{app.charAt(0)}</div>
                                                            <span className="text-[8px] font-bold text-slate-500">{app}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-auto pt-10">
                                        <Button
                                            onClick={handlePay}
                                            loading={isProcessing}
                                            className="w-full md:w-auto min-w-[240px] bg-[#3396ff] hover:bg-blue-600 text-white font-black py-6 px-10 rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] border-none"
                                        >
                                            {isProcessing ? 'Settleing...' : `Verify and Pay ₹${parseFloat(paymentRequest?.amount || 0).toLocaleString('en-IN')}`}
                                            {!isProcessing && <ArrowRight size={20} />}
                                        </Button>
                                        <p className="text-slate-400 text-[10px] mt-4 max-w-sm leading-relaxed">
                                            By continuing, you agree to ZenWallet's Terms of Service and Privacy Protocols. Transaction is non-reversible once settled.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                    <Check className="h-10 w-10 text-emerald-500" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Settled</h2>
                                    <p className="text-slate-500 text-sm">Transaction has been authorized on the Zen node.</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 w-full max-w-sm space-y-4">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                        <span>Status</span>
                                        <span className="text-emerald-500">SUCCESS</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-slate-900">
                                        <span>Settled Amount</span>
                                        <span>₹{parseFloat(paymentRequest?.amount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/dashboard')}
                                    className="h-12 px-8 border-slate-200 text-slate-600 font-bold rounded-xl"
                                >
                                    Return to Dashboard
                                </Button>
                            </motion.div>
                        )}

                        {/* Footer trust */}
                        <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-white border border-slate-200 rounded">
                                    <Shield size={14} className="text-slate-400" />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PCI-DSS Security Node</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Lock size={12} />
                                <span className="text-xs font-semibold">ZenShield Secured</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <footer className="mt-auto py-8 flex flex-col items-center gap-4 text-slate-400">
                <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default scale-90">
                    <span className="font-black text-xs">VISA</span>
                    <span className="font-black text-xs">MASTERCARD</span>
                    <span className="font-black text-xs">RUPAY</span>
                    <span className="font-black text-xs">AMEX</span>
                </div>
                <p className="text-[10px] font-medium tracking-tight">© 2026 ZenWallet Solutions Private Limited. All Node Rights Reserved.</p>
            </footer>
        </section>
    );
}
