import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    CreditCard,
    ShieldCheck,
    Coins,
    Lock
} from "lucide-react";
import { FaPaypal, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/AuthContext";
import { motion } from "framer-motion";
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

        if (user && (((user.balance as number) || 0) + finalAmount > 1000000)) {
            toast.error(`Transaction failed. Your wallet cannot hold more than ₹1,000,000 (Current: ₹${user.balance})`);
            return;
        }

        setLoading(true);
        const startTime = Date.now();
        try {
            const apiCall = axios.post(`${API_URL}/wallet/admin/add-coins`, {
                userId: user?.id,
                amount: finalAmount
            });

            const [res] = await Promise.all([
                apiCall,
                new Promise(resolve => setTimeout(resolve, 1000)) // Ensure minimum 1s loading
            ]);

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
            {/* Desktop View (Unchanged) */}
            <div className="desktop-only flex-col max-w-6xl mx-auto px-4 py-8 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* Left Column: Amount Selection */}
                    <div className="lg:col-span-4 space-y-10">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Add Money</h3>
                            <p className="text-muted-foreground text-sm font-medium">Choose an amount to add to your ZenWallet balance.</p>
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
                                        ? 'bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/5'
                                        : 'bg-card border border-border/60 hover:border-primary/20 hover:shadow-md'
                                        }`}
                                >
                                    <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${selectedAmount === amt ? 'text-primary' : 'text-muted-foreground'}`}>
                                        Amount
                                    </div>
                                    <div className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                                        ₹{amt.toLocaleString()}
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="relative group">
                                <Label className="text-xs font-semibold text-muted-foreground block mb-2 px-1 uppercase tracking-wider">Custom Amount</Label>
                                <Coins className="absolute left-4 bottom-[18px] text-muted-foreground" size={14} />
                                <Input
                                    max="200000"
                                    step="1"
                                    placeholder="Enter custom amount..."
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value.replace(/\D/g, ''));
                                        setSelectedAmount(0);
                                    }}
                                    className="h-14 pl-12 bg-muted/30 border-border text-sm font-bold rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-card border border-border/50 rounded-[1.5rem] flex gap-4 shadow-sm">
                            <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                            <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                                Total to add <span className="text-foreground font-bold">₹{finalAmount || 0}</span>.
                                Money once added to wallet cannot be refunded to source.
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Payment Form */}
                    <div className="lg:col-span-8">
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-8">Payment Mode</h3>
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
                                            className={`flex flex-col items-center justify-center gap-3 h-28 rounded-2xl transition-all ${paymentMethod === method.id
                                                ? 'bg-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/5'
                                                : 'bg-card border border-border/40 hover:border-primary/20 hover:bg-muted/30'
                                                }`}
                                        >
                                            <div className={paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}>
                                                {method.icon}
                                            </div>
                                            <span className={`text-xs font-semibold uppercase tracking-wide ${paymentMethod === method.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {method.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-muted-foreground block px-1 uppercase tracking-wider">Card Holder Name</Label>
                                        <Input
                                            name="cardholderName"
                                            placeholder="John Doe"
                                            value={cardData.cardholderName}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-border rounded-none px-1 h-12 text-sm font-semibold uppercase tracking-wide focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-muted/30"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-muted-foreground block px-1 uppercase tracking-wider">Card Number</Label>
                                        <Input
                                            name="cardNumber"
                                            placeholder="0000 0000 0000 0000"
                                            value={cardData.cardNumber}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-border rounded-none px-1 h-12 text-sm font-semibold tracking-wide focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-muted/30 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-muted-foreground block px-1 uppercase tracking-wider">Expiry (MM/YY)</Label>
                                        <Input
                                            name="expiryDate"
                                            placeholder="MM / YY"
                                            value={cardData.expiryDate}
                                            onChange={handleInputChange}
                                            required={paymentMethod === 'card'}
                                            className="bg-transparent border-none border-b border-border rounded-none px-1 h-12 text-sm font-semibold tracking-wide focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-muted/30 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold text-muted-foreground block px-1 uppercase tracking-wider">CVV</Label>
                                        <div className="relative">
                                            <Input
                                                name="cvv"
                                                type="password"
                                                maxLength={3}
                                                placeholder="123"
                                                value={cardData.cvv}
                                                onChange={handleInputChange}
                                                required={paymentMethod === 'card'}
                                                className="bg-transparent border-none border-b border-border rounded-none px-1 h-12 text-sm font-semibold tracking-wide focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-muted/30 font-mono pr-8"
                                            />
                                            <Lock size={14} className="absolute right-2 top-4 text-muted-foreground/40" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-bold text-sm rounded-xl active:scale-95 transition-all shadow-xl"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            `Add ₹${finalAmount || 0} to Wallet`
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View (Completely Redesigned) */}
            <div className="mobile-only flex-col space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* 1. Hero Balance Card (Small) */}
                <div className="bg-gradient-to-br from-primary/20 to-transparent border border-white/5 rounded-3xl p-6 flex flex-col gap-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Settlement Node</p>
                    <div className="text-3xl font-black text-foreground tabular-nums">₹{user?.balance?.toLocaleString() || '0.00'}</div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Available for Liquidity</p>
                </div>

                {/* 2. Amount Selection Grid */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-2">Inject Liquidity</p>
                    <div className="grid grid-cols-3 gap-3">
                        {AMOUNTS.map(amt => (
                            <button
                                key={amt}
                                onClick={() => {
                                    setSelectedAmount(amt);
                                    setCustomAmount("");
                                }}
                                className={`h-16 flex flex-col items-center justify-center rounded-2xl transition-all border ${selectedAmount === amt && !customAmount
                                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-white/[0.03] border-white/5 text-zinc-400'
                                    }`}
                            >
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${selectedAmount === amt ? 'text-primary-foreground/60' : 'text-zinc-600'}`}>₹</span>
                                <span className="text-sm font-black">{amt}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Custom Input */}
                <div className="relative group">
                    <Input
                        placeholder="Or enter custom INR amount..."
                        value={customAmount}
                        onChange={(e) => {
                            setCustomAmount(e.target.value.replace(/\D/g, ''));
                            setSelectedAmount(0);
                        }}
                        className="h-16 bg-white/[0.03] border-white/5 text-center text-lg font-black tracking-tight rounded-2xl focus-visible:ring-primary/20"
                    />
                </div>

                {/* 4. Simple Form & Checkout */}
                <div className="space-y-6 pt-2">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 space-y-6 shadow-2xl">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Funding Card Holder</Label>
                                <Input
                                    name="cardholderName"
                                    placeholder="CARD HOLDER"
                                    value={cardData.cardholderName}
                                    onChange={handleInputChange}
                                    className="h-14 bg-white/5 border-none text-sm font-black uppercase tracking-widest rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Funding Account Number</Label>
                                <Input
                                    name="cardNumber"
                                    placeholder="0000 0000 0000 0000"
                                    value={cardData.cardNumber}
                                    onChange={handleInputChange}
                                    className="h-14 bg-white/5 border-none text-sm font-black tracking-[0.2em] rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Expiry</Label>
                                    <Input
                                        name="expiryDate"
                                        placeholder="MM/YY"
                                        value={cardData.expiryDate}
                                        onChange={handleInputChange}
                                        className="h-14 bg-white/5 border-none text-sm font-black rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Protocol Key</Label>
                                    <Input
                                        name="cvv"
                                        type="password"
                                        placeholder="CVV"
                                        value={cardData.cvv}
                                        onChange={handleInputChange}
                                        className="h-14 bg-white/5 border-none text-sm font-black rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-[0.1em] rounded-2xl active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            {loading ? 'Settleing Node...' : `Settle ₹${finalAmount || 0} In Node`}
                        </Button>
                    </div>

                    {/* Trust Signals Mobile */}
                    <div className="flex items-center justify-center gap-6 py-4 opacity-40 grayscale">
                        <div className="flex items-center gap-1.5 grayscale shrink-0">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale shrink-0">
                            <Lock size={14} className="text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest">AES-256</span>
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
