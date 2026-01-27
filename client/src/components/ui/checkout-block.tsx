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
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import {
    CreditCard,
    Shield,
    User,
    Check,
    ChevronLeft,
    Percent,
    X,
    Wallet,
    Smartphone,
    Building2,
    Clock,
    ShoppingBag,
    Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

interface OrderItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    quantity: number;
    discount?: number;
}

interface CheckoutSummary {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
}

interface PaymentMethod {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    nameOnCard: string;
    upiId?: string;
}

export default function Checkout() {
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<number>(1);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        nameOnCard: "",
    });
    const [selectedPaymentType, setSelectedPaymentType] = useState<string>("card");
    const [upiId, setUpiId] = useState<string>("");
    const [savePaymentMethod, setSavePaymentMethod] = useState<boolean>(false);
    const [appliedPromo, setAppliedPromo] = useState<string>("VIP20");
    const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

    // Mock Data relevant to Payment Gateway / Event Booking
    const sampleOrderItems: OrderItem[] = [
        {
            id: "evt-2026-vip",
            name: "VIP Pass - Tech Conference 2026",
            price: 499.00,
            originalPrice: 599.00,
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
            quantity: 1,
            discount: 17,
        },
        {
            id: "evt-addons",
            name: "Networking Dinner Add-on",
            price: 50.00,
            image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
            quantity: 1,
        }
    ];

    useEffect(() => {
        const loadCheckout = async () => {
            setIsLoading(true);
            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 800));
            setOrderItems(sampleOrderItems);
            setIsLoading(false);
        };

        loadCheckout();
    }, []);

    const calculateSummary = (): CheckoutSummary => {
        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const discount = appliedPromo === "VIP20" ? subtotal * 0.1 : 0;
        const tax = (subtotal - discount) * 0.08; // 8% tax
        const total = subtotal - discount + tax;

        return {
            subtotal,
            discount,
            tax,
            total,
        };
    };

    const handlePaymentChange = (field: keyof PaymentMethod, value: string) => {
        let formattedValue = value;
        if (field === "cardNumber") {
            formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (field === "cvv") {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }
        setPaymentMethod((prev) => ({
            ...prev,
            [field]: formattedValue,
        }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1: // Payment
                if (selectedPaymentType === "card" || selectedPaymentType === "zenwallet") {
                    const rawCard = paymentMethod.cardNumber.replace(/\s/g, "");
                    const isCardValid = /^\d{16}$/.test(rawCard);
                    const isFormatValid = rawCard.startsWith("0605") && rawCard.endsWith("2212");
                    const isCvvValid = /^\d{3,4}$/.test(paymentMethod.cvv);
                    return !!(
                        isCardValid &&
                        isFormatValid &&
                        paymentMethod.expiryMonth &&
                        paymentMethod.expiryYear &&
                        isCvvValid &&
                        paymentMethod.nameOnCard
                    );
                }
                if (selectedPaymentType === "upi") {
                    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
                }
                return !!selectedPaymentType;
            case 2: // Review
                return agreeToTerms;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 3)); // Increased to 3 for success state
        }
    };

    const handlePay = async () => {
        if (!validateStep(2)) return;

        setIsProcessing(true);
        try {
            if (selectedPaymentType === 'card' || selectedPaymentType === 'zenwallet') {
                const getApiUrl = () => {
                    const envUrl = import.meta.env.VITE_API_URL;
                    const prodUrl = 'https://payment-gateway-up7l.onrender.com/api';
                    if (!envUrl) return prodUrl;

                    if (typeof window !== 'undefined' &&
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                        return envUrl;
                    }

                    if (envUrl.includes('localhost')) {
                        return prodUrl;
                    }
                    return envUrl;
                };
                const API_URL = getApiUrl();
                const res = await axios.post(`${API_URL}/external/verify-card`, {
                    cardNumber: paymentMethod.cardNumber,
                    cvv: paymentMethod.cvv,
                    expiryMonth: paymentMethod.expiryMonth,
                    expiryYear: paymentMethod.expiryYear,
                    amount: summary.total
                });

                if (!res.data.success) {
                    toast.error(res.data.message || 'Card verification failed');
                    setIsProcessing(false);
                    return;
                }
            }

            // Simulate gateway latency for actual transaction processing
            await new Promise(resolve => setTimeout(resolve, 2500));
            setIsProcessing(false);
            setCurrentStep(3); // Go to success state
        } catch (err: any) {
            console.error('Payment Error:', err);
            toast.error(err.response?.data?.message || 'Transaction failed. Please check your card details.');
            setIsProcessing(false);
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const removePromo = () => {
        setAppliedPromo("");
    };

    const summary = calculateSummary();

    const CheckoutSkeleton = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardContent className="p-6 flex flex-col gap-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-4">
                        <Skeleton className="h-6 w-24" />
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const OrderSummaryCard = () => (
        <Card className="flex flex-col gap-5 border-zinc-800 bg-zinc-900/50">
            <CardHeader>
                <h3 className="font-semibold flex items-center gap-2 text-zinc-100">
                    <ShoppingBag className="h-4 w-4" />
                    Event Summary
                </h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Order Items */}
                <div className="flex flex-col gap-4">
                    {orderItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-md border border-zinc-800"
                                />
                                <Badge
                                    size="sm"
                                    variant="secondary"
                                    className="absolute -top-1 -right-1 text-[10px] min-w-4 h-4 flex items-center justify-center p-0"
                                >
                                    {item.quantity}
                                </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-zinc-200">{item.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-zinc-300">₹{item.price}</span>
                                    {item.originalPrice && (
                                        <span className="text-xs text-zinc-600 line-through">
                                            ₹{item.originalPrice}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm font-semibold text-zinc-200">
                                ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Applied Promo */}
                {appliedPromo && (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-ele border border-green-500/20">
                        <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">
                                {appliedPromo}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removePromo}
                            className="h-6 w-6 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Pricing Breakdown */}
                <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                    <div className="flex justify-between text-sm text-zinc-400">
                        <span>Subtotal</span>
                        <span>₹{summary.subtotal.toFixed(2)}</span>
                    </div>
                    {summary.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                            <span>Discount</span>
                            <span>-₹{summary.discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-zinc-400">
                        <span>Tax (8%)</span>
                        <span>₹{summary.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-zinc-800 pt-3 text-white">
                        <span>Total</span>
                        <span>₹{summary.total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="w-full mx-auto p-6 flex flex-col gap-6 max-w-7xl">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <CheckoutSkeleton />
            </div>
        );
    }

    return (
        <div className="w-full mx-auto p-4 md:p-8 flex flex-col gap-8 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-col">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (window.history.length > 1) window.history.back();
                            else navigate('/');
                        }}
                        className="flex items-center gap-1 text-zinc-500 hover:text-white pl-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Event Page
                    </Button>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-white tracking-tight">
                            Checkout
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            Complete your secure transaction
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 border-zinc-800 text-zinc-400 bg-zinc-900/50">
                    <Shield className="h-3 w-3" />
                    SSL Secured
                </Badge>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-start gap-4 sm:gap-6">
                {[
                    { step: 1, label: "Payment", icon: CreditCard },
                    { step: 2, label: "Review", icon: Check },
                ].map(({ step, label, icon: Icon }, index) => (
                    <div key={step} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                                    currentStep >= step
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-zinc-800 text-zinc-600"
                                )}
                            >
                                {currentStep > step ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-sm font-medium hidden sm:block uppercase tracking-wide",
                                    currentStep >= step
                                        ? "text-white"
                                        : "text-zinc-600"
                                )}
                            >
                                {label}
                            </span>
                        </div>
                        {index < 1 && (
                            <div
                                className={cn(
                                    "w-12 h-0.5",
                                    currentStep > step
                                        ? "bg-indigo-600"
                                        : "bg-zinc-800"
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Step 1: Payment Information */}
                    {currentStep === 1 && (
                        <Card className="flex flex-col gap-6 bg-zinc-950 border-zinc-900">
                            <CardHeader>
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                                    <CreditCard className="h-5 w-5 text-indigo-500" />
                                    Payment Information
                                </h2>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-6">
                                {/* Payment Method Selection */}
                                <Label className="text-base font-medium text-zinc-300">
                                    Choose Payment Method
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Credit/Debit Card */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPaymentType("card");
                                            // Clear form if switching to manual card entry (optional, but requested behavior implies user uses *their* card for ZenWallet)
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-4 border rounded-ele transition-colors text-left",
                                            selectedPaymentType === "card"
                                                ? "border-zinc-700 bg-zinc-800 ring-1 ring-zinc-700"
                                                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                                        )}
                                    >
                                        <CreditCard className={cn("h-5 w-5", selectedPaymentType === "card" ? "text-white" : "text-zinc-500")} />
                                        <div>
                                            <div className="font-medium text-zinc-200">New Card</div>
                                            <div className="text-xs text-zinc-500">
                                                Enter details manually
                                            </div>
                                        </div>
                                    </button>

                                    {/* ZenWallet */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPaymentType("zenwallet");
                                            if (user?.virtualCard) {
                                                setPaymentMethod({
                                                    nameOnCard: user.full_name,
                                                    cardNumber: user.virtualCard.cardNumber,
                                                    expiryMonth: user.virtualCard.expiryMonth,
                                                    expiryYear: user.virtualCard.expiryYear,
                                                    cvv: user.virtualCard.cvv
                                                });
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-4 border rounded-ele transition-colors text-left relative overflow-hidden",
                                            selectedPaymentType === "zenwallet"
                                                ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50"
                                                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                                        )}
                                    >
                                        {selectedPaymentType === "zenwallet" && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />}
                                        <Wallet className={cn("h-5 w-5 z-10", selectedPaymentType === "zenwallet" ? "text-indigo-400" : "text-zinc-500")} />
                                        <div className="z-10">
                                            <div className="font-medium text-zinc-200 flex items-center gap-2">
                                                ZenWallet
                                                {user?.virtualCard && <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/20">AUTOFILLED</Badge>}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Pay with Virtual Card
                                            </div>
                                        </div>
                                    </button>

                                    {/* UPI Payment */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPaymentType("upi");
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-4 border rounded-ele transition-colors text-left",
                                            selectedPaymentType === "upi"
                                                ? "border-zinc-700 bg-zinc-800 ring-1 ring-zinc-700"
                                                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                                        )}
                                    >
                                        <Smartphone className={cn("h-5 w-5", selectedPaymentType === "upi" ? "text-white" : "text-zinc-500")} />
                                        <div>
                                            <div className="font-medium text-zinc-200">UPI / QR</div>
                                            <div className="text-xs text-zinc-500">
                                                Pay using any UPI App
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* UPI Form */}
                                {selectedPaymentType === "upi" && (
                                    <div className="flex flex-col gap-5 border-t border-zinc-800 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="upiId" className="text-zinc-400">Enter UPI ID</Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                                <Input
                                                    id="upiId"
                                                    size="lg"
                                                    placeholder="username@bank"
                                                    value={upiId}
                                                    onChange={(e) => setUpiId(e.target.value)}
                                                    className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-600"
                                                />
                                            </div>
                                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tight">
                                                A request will be sent to your UPI App
                                            </p>
                                        </div>
                                    </div>
                                )}


                                {/* Credit Card Form */}
                                {(selectedPaymentType === "card" || selectedPaymentType === "zenwallet") && (
                                    <div className="flex flex-col gap-5 border-t border-zinc-800 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {selectedPaymentType === "zenwallet" && !user?.virtualCard && (
                                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-sm text-indigo-300 mb-2">
                                                Sign in to ZenWallet to use your virtual card.
                                            </div>
                                        )}
                                        {selectedPaymentType === "zenwallet" && user?.virtualCard && (
                                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-300 mb-2 flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                Virtual Card details loaded securely.
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="nameOnCard" className="text-zinc-400">Name on Card</Label>
                                            <Input
                                                id="nameOnCard"
                                                size="lg"
                                                placeholder="John Doe"
                                                value={paymentMethod.nameOnCard}
                                                onChange={(e) =>
                                                    handlePaymentChange("nameOnCard", e.target.value)
                                                }
                                                leftIcon={<User className="h-4 w-4" />}
                                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-600"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="cardNumber" className="text-zinc-400">Card Number</Label>
                                            <Input
                                                id="cardNumber"
                                                size="lg"
                                                placeholder="0605 0000 0000 2212"
                                                value={paymentMethod.cardNumber}
                                                onChange={(e) =>
                                                    handlePaymentChange("cardNumber", e.target.value)
                                                }
                                                leftIcon={<CreditCard className="h-4 w-4" />}
                                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-600"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="expiryMonth" className="text-zinc-400">Month</Label>
                                                <Select
                                                    value={paymentMethod.expiryMonth}
                                                    onValueChange={(value) =>
                                                        handlePaymentChange("expiryMonth", value)
                                                    }
                                                >
                                                    <SelectTrigger className="text-sm bg-zinc-900 border-zinc-800 text-white" size={"lg"}>
                                                        <SelectValue placeholder="MM" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {Array.from({ length: 12 }, (_, i) => (
                                                            <SelectItem
                                                                key={i + 1}
                                                                value={String(i + 1).padStart(2, "0")}
                                                            >
                                                                {String(i + 1).padStart(2, "0")}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="expiryYear" className="text-zinc-400">Year</Label>
                                                <Select
                                                    value={paymentMethod.expiryYear}
                                                    onValueChange={(value) =>
                                                        handlePaymentChange("expiryYear", value)
                                                    }
                                                >
                                                    <SelectTrigger className="text-sm bg-zinc-900 border-zinc-800 text-white" size={"lg"}>
                                                        <SelectValue placeholder="YY" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {Array.from({ length: 10 }, (_, i) => (
                                                            <SelectItem
                                                                key={2024 + i}
                                                                value={String(2024 + i)}
                                                            >
                                                                {2024 + i}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="cvv" className="text-zinc-400">CVV</Label>
                                                <Input
                                                    id="cvv"
                                                    size="lg"
                                                    type="password"
                                                    placeholder="123"
                                                    maxLength={4}
                                                    value={paymentMethod.cvv}
                                                    onChange={(e) =>
                                                        handlePaymentChange("cvv", e.target.value)
                                                    }
                                                    leftIcon={<Lock className="h-4 w-4" />}
                                                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Spacer for removed PayPal/GooglePay */}

                                {/* Save Payment Method */}
                                {(selectedPaymentType === "card" || selectedPaymentType === "zenwallet") && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <Checkbox
                                            id="savePayment"
                                            checked={savePaymentMethod}
                                            onCheckedChange={(checked) =>
                                                setSavePaymentMethod(checked === true)
                                            }
                                            className="border-zinc-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <Label htmlFor="savePayment" className="text-sm text-zinc-400 font-normal cursor-pointer">
                                            Save payment method for future purchases
                                        </Label>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end pt-2">
                                <Button
                                    onClick={nextStep}
                                    disabled={!validateStep(1)}
                                    size="lg"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-widest font-bold h-12 px-8"
                                >
                                    Review Order
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Step 2: Review Order */}
                    {currentStep === 2 && (
                        <Card className="flex flex-col gap-6 bg-zinc-950 border-zinc-900">
                            <CardHeader>
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                                    <Check className="h-5 w-5 text-green-500" />
                                    Review Your Order
                                </h2>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-6">

                                {/* Payment Method Review */}
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-medium text-zinc-300">Payment Method</h3>
                                    <div className="text-sm text-zinc-400 p-4 bg-zinc-900/50 rounded-ele border border-zinc-800">
                                        {(selectedPaymentType === "card" || selectedPaymentType === "zenwallet") && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-zinc-200 font-medium">{selectedPaymentType === "zenwallet" ? "ZenWallet Virtual Card" : "Credit Card"}</span>
                                                    <span className="font-mono">**** **** **** {paymentMethod.cardNumber.replace(/\s/g, "").slice(-4)}</span>
                                                </div>
                                                <CreditCard className="text-zinc-500" />
                                            </div>
                                        )}
                                        {selectedPaymentType === "upi" && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-zinc-200 font-medium">UPI Payment</span>
                                                    <span className="font-mono">{upiId}</span>
                                                </div>
                                                <Smartphone className="text-zinc-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>


                                {/* Terms and Conditions */}
                                <div className="flex items-start gap-3 border-t border-zinc-800 pt-6">
                                    <Checkbox
                                        id="agreeTerms"
                                        checked={agreeToTerms}
                                        onCheckedChange={(checked) =>
                                            setAgreeToTerms(checked === true)
                                        }
                                        className="border-zinc-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 mt-1"
                                    />
                                    <Label
                                        htmlFor="agreeTerms"
                                        className="text-sm leading-relaxed text-zinc-400 font-normal"
                                    >
                                        I agree to the{" "}
                                        <span className="text-indigo-400 hover:underline cursor-pointer">
                                            Terms of Service
                                        </span>{" "}
                                        and{" "}
                                        <span className="text-indigo-400 hover:underline cursor-pointer">
                                            Privacy Policy
                                        </span>. I authorize Apex Electronics to charge my payment method for the total amount.
                                    </Label>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-2">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={prevStep}
                                    className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handlePay}
                                    disabled={!validateStep(2) || isProcessing}
                                    size="lg"
                                    className="bg-green-600 hover:bg-green-500 text-white font-bold flex items-center gap-2 h-12 px-8 uppercase tracking-widest min-w-[160px]"
                                >
                                    {isProcessing ? (
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Lock className="h-4 w-4" />
                                    )}
                                    {isProcessing ? "Processing..." : `Pay ₹${summary.total.toFixed(2)}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                    {/* Step 3: Success State */}
                    {currentStep === 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full"
                        >
                            <Card className="bg-zinc-950 border-zinc-900 overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
                                <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
                                    <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                        <Check className="h-12 w-12 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-bold text-white tracking-tight">Payment Successful</h2>
                                        <p className="text-zinc-500 max-w-sm mx-auto">
                                            Your transaction has been authorized and your VIP Pass is now active.
                                        </p>
                                    </div>
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 w-full max-w-md space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Transaction ID</span>
                                            <span className="text-zinc-300 font-mono uppercase text-xs">TX-GZ{Math.random().toString(36).substring(7).toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Amount Paid</span>
                                            <span className="text-white font-bold">${summary.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Status</span>
                                            <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">Settled</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/dashboard')}
                                            className="border-zinc-800 text-zinc-400 hover:text-white"
                                        >
                                            Go to Dashboard
                                        </Button>
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                                            onClick={() => window.location.reload()}
                                        >
                                            View Ticket
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Order Summary Sidebar */}
                <div className="flex flex-col gap-4">
                    <OrderSummaryCard />

                    {/* Security Badge */}
                    <Card className="bg-zinc-900/30 border-zinc-800/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="h-5 w-5 text-green-500" />
                                <div>
                                    <div className="font-medium text-zinc-200">Secure & Encrypted</div>
                                    <div className="text-zinc-500 text-xs">
                                        Your data is protected with 256-bit SSL encryption
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div >
        </div >
    );
}
