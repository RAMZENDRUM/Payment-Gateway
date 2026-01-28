"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    ArrowRight,
    User,
    Phone,
    Globe,
    CheckCircle2,
    ArrowLeft
} from "lucide-react";
import toast from 'react-hot-toast';

export default function Register() {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [purpose, setPurpose] = useState('Website');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { register, verifyOtp } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(email, password, fullName, phoneNumber, purpose);
            setStep('otp');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Operation failed. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOtp(email, otp);
            navigate('/login');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

        const make = () => ({
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
        .hline::after,.vline::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(250,250,250,.24),transparent);opacity:0;animation:shimmer .9s ease-out forwards}
        .hline:nth-child(1)::after{animation-delay:.12s}
        .hline:nth-child(2)::after{animation-delay:.22s}
        .hline:nth-child(3)::after{animation-delay:.32s}
        .vline:nth-child(4)::after{animation-delay:.42s}
        .vline:nth-child(5)::after{animation-delay:.54s}
        .vline:nth-child(6)::after{animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
        @keyframes shimmer{0%{opacity:0}35%{opacity:.25}100%{opacity:0}}

        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.4s forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />

            <div className="accent-lines">
                <div className="hline" />
                <div className="hline" />
                <div className="hline" />
                <div className="vline" />
                <div className="vline" />
                <div className="vline" />
            </div>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none"
            />

            <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 z-50">
                <span className="text-xs tracking-[0.14em] uppercase text-zinc-400">
                    ZENWALLET
                </span>
                <Button
                    variant="link"
                    asChild
                    className="text-zinc-400 hover:text-zinc-50 relative z-[51]"
                >
                    <Link to="/login">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Link>
                </Button>
            </header>

            <div className="min-h-screen h-full w-full grid place-items-center px-4 relative z-10 py-20">
                <Card className="card-animate w-full max-w-md border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
                    {step === 'form' ? (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Join the premium payment network
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-5">
                                <form onSubmit={handleRegister} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName" className="text-zinc-300">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="fullName"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phoneNumber" className="text-zinc-300">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                                <Input
                                                    id="phoneNumber"
                                                    placeholder="+91..."
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-12 rounded-xl"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="purpose" className="text-zinc-300">Purpose</Label>
                                            <Select value={purpose} onValueChange={setPurpose}>
                                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-50 h-12 rounded-xl">
                                                    <SelectValue placeholder="Select purpose" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                    <SelectItem value="Website">Website</SelectItem>
                                                    <SelectItem value="Business">Business</SelectItem>
                                                    <SelectItem value="Freelance">Freelance</SelectItem>
                                                    <SelectItem value="Personal">Personal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-12 rounded-xl"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-200"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button disabled={loading} type="submit" className="w-full h-11 mt-2 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-bold transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                                        {loading ? 'Processing...' : 'Create Account'}
                                        {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                                    </Button>
                                </form>

                                <div className="text-center text-sm text-zinc-500">
                                    By clicking create account, you agree to our{' '}
                                    <Link to="/terms" className="text-zinc-300 hover:underline">Terms of Service</Link>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/20">
                                    <CheckCircle2 className="text-indigo-400" size={24} />
                                </div>
                                <CardTitle className="text-2xl font-bold">Verify Email</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    We've sent a 6-digit code to <br />
                                    <span className="text-zinc-200 font-medium">{email}</span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-5">
                                <form onSubmit={handleVerifyOtp} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="otp" className="text-zinc-300 text-center mb-2">One-Time Password</Label>
                                        <Input
                                            id="otp"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="text-center text-2xl tracking-[0.5em] h-14 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700"
                                            required
                                            maxLength={6}
                                        />
                                    </div>

                                    <Button disabled={loading} type="submit" className="w-full h-11 mt-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-600/20">
                                        {loading ? 'Verifying...' : 'Verify & Sign Up'}
                                    </Button>
                                </form>

                                <div className="text-center text-sm text-zinc-500">
                                    Didn't receive the code?{' '}
                                    <button onClick={handleRegister} className="text-indigo-400 hover:underline">Resend OTP</button>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('form')}
                                    className="text-zinc-400 hover:text-zinc-200"
                                >
                                    Change email address
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </section>
    );
}
