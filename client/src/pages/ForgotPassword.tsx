"use client";

import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, ArrowRight, ArrowLeft, Lock, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

export default function ForgotPassword() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            toast.success('Reset OTP sent to your email');
            setStep('otp');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
            toast.success('Password reset successfully');
            navigate('/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    // Particles logic
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();

        type P = { x: number; y: number; v: number; o: number };
        let ps: P[] = [];
        let raf = 0;

        const make = (): P => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            v: Math.random() * 0.25 + 0.05,
            o: Math.random() * 0.35 + 0.15,
        });

        const init = () => {
            ps = [];
            const count = Math.floor((canvas.width * canvas.height) / 9000);
            for (let i = 0; i < count; i++) ps.push(make());
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ps.forEach((p) => {
                p.y -= p.v;
                if (p.y < 0) {
                    p.x = Math.random() * canvas.width;
                    p.y = canvas.height + Math.random() * 40;
                    p.v = Math.random() * 0.25 + 0.05;
                    p.o = Math.random() * 0.35 + 0.15;
                }
                ctx.fillStyle = `rgba(250,250,250,${p.o})`;
                ctx.fillRect(p.x, p.y, 0.7, 2.2);
            });
            raf = requestAnimationFrame(draw);
        };

        const onResize = () => {
            setSize();
            init();
        };

        window.addEventListener("resize", onResize);
        init();
        raf = requestAnimationFrame(draw);
        return () => {
            window.removeEventListener("resize", onResize);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <section className="fixed inset-0 bg-zinc-950 text-zinc-50 overflow-auto">
            <style>{`
        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp .8s cubic-bezier(.22,.61,.36,1) .4s forwards;
        }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.7}
        .hline,.vline{position:absolute;background:#27272a;will-change:transform,opacity}
        .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .hline:nth-child(1){top:18%;animation-delay:.12s}
        .hline:nth-child(2){top:50%;animation-delay:.22s}
        .hline:nth-child(3){top:82%;animation-delay:.32s}
        .vline:nth-child(4){left:22%;animation-delay:.42s}
        .vline:nth-child(5){left:50%;animation-delay:.54s}
        .vline:nth-child(6){left:78%;animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
      `}</style>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none"
            />

            <div className="accent-lines">
                <div className="hline" />
                <div className="hline" />
                <div className="hline" />
                <div className="vline" />
                <div className="vline" />
                <div className="vline" />
            </div>

            <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 z-10">
                <span className="text-xs tracking-[0.14em] uppercase text-zinc-400">
                    ZENWALLET
                </span>
                <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="h-9 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                </Button>
            </header>

            <div className="min-h-screen h-full w-full grid place-items-center px-4 relative z-10">
                <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
                    {step === 'email' ? (
                        <>
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-2xl">Forgot password?</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Enter your email and we'll send you a reset code
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-5">
                                <form onSubmit={handleSendOtp} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-zinc-300">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-10 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
                                    >
                                        {loading ? 'Sending...' : 'Send Reset OTP'}
                                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/20">
                                    <CheckCircle2 className="text-indigo-400" size={24} />
                                </div>
                                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Enter the code sent to {email}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-5">
                                <form onSubmit={handleResetPassword} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="otp" className="text-zinc-300">Reset Code</Label>
                                        <Input
                                            id="otp"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="text-center text-xl tracking-[0.3em] h-12 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700"
                                            required
                                            maxLength={6}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="newPassword" className="text-zinc-300">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-11 mt-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-600/20"
                                    >
                                        {loading ? 'Updating...' : 'Reset Password'}
                                    </Button>
                                </form>

                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('email')}
                                    className="text-zinc-400 hover:text-zinc-200"
                                >
                                    Try different email
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </section>
    );
}
