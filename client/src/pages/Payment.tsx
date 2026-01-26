import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaPaypal, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = 'http://localhost:5000/api';

export default function PaymentPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        amount: 100
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Add coins to wallet after successful payment
            await axios.post(`${API_URL}/wallet/admin/add-coins`, {
                userId: localStorage.getItem('userId'),
                amount: formData.amount
            });

            toast.success(`Successfully added ${formData.amount} coins to your wallet!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020617] text-white p-4 md:p-8 flex flex-col">
            <header className="mb-8 flex items-center gap-4 max-w-2xl mx-auto w-full">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Add Coins to Wallet</h1>
                    <p className="text-slate-400 text-sm mt-1">Choose your payment method</p>
                </div>
            </header>

            <div className="flex items-center justify-center flex-1">
                <Card className="max-w-md w-full rounded-2xl shadow-lg bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6 space-y-6">
                        {/* Amount Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-white">Select Amount</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[50, 100, 200, 500, 1000, 2000].map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: amt })}
                                        className={`py-3 px-4 rounded-lg font-bold transition-all ${formData.amount === amt
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {amt} C
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="grid grid-cols-3 gap-4">
                            <Button variant="outline" className="h-14 p-0 flex items-center justify-center gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white">
                                <FaPaypal fontSize={24} className="text-blue-500" />
                                <span className="text-sm font-medium">PayPal</span>
                            </Button>
                            <Button variant="outline" className="h-14 p-0 flex items-center justify-center gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white">
                                <FaApple fontSize={24} />
                                <span className="text-sm font-medium">Pay</span>
                            </Button>
                            <Button variant="outline" className="h-14 p-0 flex items-center justify-center gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white">
                                <FcGoogle fontSize={30} />
                                <span className="text-sm font-medium">Pay</span>
                            </Button>
                        </div>

                        {/* Separator */}
                        <div className="flex items-center text-slate-500">
                            <hr className="flex-grow border-t border-slate-700" />
                            <span className="mx-2 text-xs font-medium">or pay using credit card</span>
                            <hr className="flex-grow border-t border-slate-700" />
                        </div>

                        {/* Credit Card Form */}
                        <form onSubmit={handleCheckout} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="cardholder-name" className="text-white">Card holder full name</Label>
                                <Input
                                    id="cardholder-name"
                                    name="cardholderName"
                                    placeholder="Enter your full name"
                                    value={formData.cardholderName}
                                    onChange={handleInputChange}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="card-number" className="text-white">Card Number</Label>
                                <Input
                                    id="card-number"
                                    name="cardNumber"
                                    placeholder="0000 0000 0000 0000"
                                    inputMode="numeric"
                                    value={formData.cardNumber}
                                    onChange={handleInputChange}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="expiry" className="text-white">Expiry Date / CVV</Label>
                                <div className="flex gap-4">
                                    <Input
                                        id="expiry"
                                        name="expiryDate"
                                        placeholder="MM/YY"
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        required
                                    />
                                    <Input
                                        id="cvv"
                                        name="cvv"
                                        placeholder="CVV"
                                        inputMode="numeric"
                                        type="password"
                                        maxLength="3"
                                        value={formData.cvv}
                                        onChange={handleInputChange}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : `Checkout - ${formData.amount} Coins`}
                            </Button>
                        </form>

                        <p className="text-xs text-slate-500 text-center">
                            Your payment information is secure and encrypted
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
