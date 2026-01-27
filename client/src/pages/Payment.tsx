import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    CreditCard,
    ShieldCheck,
    ArrowLeft,
    Coins,
    Plus,
    Check,
    Lock
} from "lucide-react";
import { FaPaypal, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import TransactionReceipt, { TransactionData } from "@/components/ui/transaction-receipt";


import { API_URL } from '@/lib/api';

const AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function PaymentPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(100);
    const [customAmount, setCustomAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'apple' | 'google'>('card');
    const [showReceipt, setShowReceipt] = useState(false);
    const [txDetails, setTxDetails] = useState<TransactionData | null>(null);

    const [cardData, setCardData] = useState({
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    });

    const finalAmount = useMemo(() => {
        return customAmount ? parseInt(customAmount) : selectedAmount;
    }, [customAmount, selectedAmount]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'cardNumber') {
            const formatted = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
            setCardData(prev => ({ ...prev, [name]: formatted }));
        } else if (name === 'expiryDate') {
            const formatted = value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').trim().slice(0, 5);
            setCardData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setCardData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!finalAmount || finalAmount < 10) {
            toast.error("Minimum top-up is ₹10");
            return;
        }

        if (finalAmount > 200000) {
            toast.error("Maximum single refill limit is ₹2,00,000");
            return;
        }

        // Potential check for existing balance + new amount
        if (user && (((user.balance as number) || 0) + finalAmount > 1000000)) {
            toast.error(`Transaction failed. Your wallet cannot hold more than ₹1,000,000 (Current: ₹${user.balance})`);
            return;
        }

        setLoading(true);
        try {
            // Simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await axios.post(`${API_URL}/wallet/admin/add-coins`, {
                userId: user?.id,
                amount: finalAmount
            });

            if (res.data.success) {
                toast.success(`Successfully refilled ₹${finalAmount}!`);
                setTxDetails(res.data.transaction);
                setShowReceipt(true);
            } else {
                toast.error(res.data.message || "Payment processing failed");
            }
        } catch (err) {
            console.error(err);
            toast.error('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Refill INR" subtitle="Instant INR top-up with secure encryption">
            <div className="max-w-6xl mx-auto px-4 py-8 md:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* Left Column: Amount Selection */}
                    <div className="lg:col-span-4 space-y-10">
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Add Money</h3>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Choose an amount to add to your ZenWallet balance.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {AMOUNTS.map(amt => (
                                <motion.button
                                    key={amt}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setSelectedAmount(amt);
                                        setCustomAmount("");
                                    }}
                                    className={`relative py-5 px-6 rounded-2xl text-left transition-all ${selectedAmount === amt && !customAmount
                                        ? 'bg-blue-600/10 ring-1 ring-blue-500/20'
                                        : 'bg-zinc-900 border border-zinc-400/10 hover:border-zinc-400/20'
                                        }`}
                                >
                                    <div className={`text-[11px] font-medium mb-1 ${selectedAmount === amt ? 'text-blue-500' : 'text-zinc-500'}`}>
                                        Amount
                                    </div>
                                    <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                                        ₹{amt.toLocaleString()}
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="relative group">
                                <Label className="text-[13px] font-medium text-zinc-500 block mb-3 px-1">Other Amount</Label>
                                <Coins className="absolute left-4 bottom-[18px] text-zinc-700" size={14} />
                                <Input
                                    max="200000"
                                    step="1"
                                    placeholder="Enter custom amount..."
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value.replace(/\D/g, ''));
                                        setSelectedAmount(0);
                                    }}
                                    className="h-14 pl-12 bg-white/[0.02] border-zinc-400/10 text-sm font-medium rounded-2xl focus-visible:ring-1 focus-visible:ring-white/5"
                                />
                            </div>
                        </div>

                        <div className="p-6 dashboard-card flex gap-4">
                            <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                            <div className="text-[12px] text-zinc-500 leading-relaxed font-medium">
                                Total to add <span className="text-white">₹{finalAmount || 0}</span>.
                                Money once added to wallet cannot be refunded to source.
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Payment Form */}
                    <div className="lg:col-span-8">
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-8">Payment Mode</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { id: 'card', icon: <CreditCard size={18} />, label: 'Debit/Credit Card' },
                                        { id: 'paypal', icon: <FaPaypal size={18} />, label: 'Net Banking' },
                                        { id: 'apple', icon: <FaApple size={18} />, label: 'Apple Pay' },
                                        { id: 'google', icon: <FcGoogle size={18} />, label: 'Google Pay' }
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`flex flex-col items-center justify-center gap-3 h-24 rounded-2xl transition-all ${paymentMethod === method.id ? 'bg-blue-600/10 ring-1 ring-blue-500/20' : 'bg-transparent border border-zinc-400/10 hover:border-zinc-400/20'}`}
                                        >
                                            <div className={paymentMethod === method.id ? 'text-blue-500' : 'text-zinc-600'}>
                                                {method.icon}
                                            </div>
                                            <span className={`text-[12px] font-medium ${paymentMethod === method.id ? 'text-white' : 'text-zinc-600'}`}>
                                                {method.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    <div className="space-y-3">
                                        <Label className="text-[13px] font-medium text-zinc-500 block px-1">Card Holder Name</Label>
                                        <Input
                                            name="cardholderName"
                                            placeholder="As per bank records"
                                            value={cardData.cardholderName}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-zinc-400/20 rounded-none px-1 h-12 text-[14px] font-medium focus-visible:ring-0 focus-visible:border-blue-500/40 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[13px] font-medium text-zinc-500 block px-1">Card Number</Label>
                                        <Input
                                            name="cardNumber"
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            value={cardData.cardNumber}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-zinc-400/20 rounded-none px-1 h-12 text-[14px] font-medium focus-visible:ring-0 focus-visible:border-blue-500/40 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[13px] font-medium text-zinc-500 block px-1">Expiry (MM/YY)</Label>
                                        <Input
                                            name="expiryDate"
                                            placeholder="MM / YY"
                                            value={cardData.expiryDate}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-zinc-400/20 rounded-none px-1 h-12 text-[14px] font-medium focus-visible:ring-0 focus-visible:border-blue-500/40 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[13px] font-medium text-zinc-500 block px-1">CVV</Label>
                                        <Input
                                            name="cvv"
                                            type="password"
                                            maxLength={3}
                                            placeholder="XXX"
                                            value={cardData.cvv}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-zinc-400/20 rounded-none px-1 h-12 text-[14px] font-medium focus-visible:ring-0 focus-visible:border-blue-500/40 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-bold text-base rounded-2xl active:scale-95 transition-all shadow-2xl"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 border-2 border-zinc-500 border-t-black rounded-full animate-spin"></div>
                                                <span>Adding Money...</span>
                                            </div>
                                        ) : (
                                            `Add ₹${finalAmount || 0} to Wallet`
                                        )}
                                    </Button>
                                </div>
                            </form>

                            <div className="flex items-center gap-12 pt-8 text-xs font-medium text-zinc-600">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                                    100% Safe and Secure
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                                    Bank Grade Encryption
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TransactionReceipt
                isOpen={showReceipt}
                onClose={() => {
                    setShowReceipt(false);
                    navigate('/dashboard');
                }}
                transaction={txDetails}
            />
        </AppLayout>
    );
}
