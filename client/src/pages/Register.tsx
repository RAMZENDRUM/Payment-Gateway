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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
    CheckCircle2,
    ArrowLeft,
    ShieldCheck
} from "lucide-react";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [purpose, setPurpose] = useState('Website');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showPassword, setShowPassword] = useState(false);

    const { register, verifyOtp } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(email, password, fullName, phoneNumber, purpose);
            setStep('otp');
            toast.success('Verification code sent');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Operation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length !== 6) return toast.error('Enter 6-digit code');

        setLoading(true);
        try {
            await verifyOtp(email, fullOtp);
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
            ps.push(make());
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
                ctx.fillStyle = `rgba(235, 235, 235, ${p.o})`;
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
        <section className="fixed inset-0 bg-background text-foreground overflow-auto transition-colors duration-300">
            <style>{`
                .accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.3}
                .hline,.vline{position:absolute;background:currentColor;will-change:transform,opacity;opacity:0.12}
                .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
                .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
                @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
                @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
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

            <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(139,92,246,0.04),transparent_60%)]" />

            <div className="accent-lines">
                <div className="hline" style={{ top: '18%' }} />
                <div className="hline" style={{ top: '50%' }} />
                <div className="hline" style={{ top: '82%' }} />
                <div className="vline" style={{ left: '22%' }} />
                <div className="vline" style={{ left: '50%' }} />
                <div className="vline" style={{ left: '78%' }} />
            </div>

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen pointer-events-none dark:opacity-50" />

            <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-border/50 z-50 bg-background/20 backdrop-blur-md">
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-500">
                    ZENWALLET
                </span>
                <Button variant="link" asChild className="text-zinc-500 hover:text-foreground relative z-[51] font-bold">
                    <Link to="/login">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Link>
                </Button>
            </header>

            <div className="min-h-screen h-full w-full grid place-items-center px-4 relative z-10 py-20">
                <Card className="card-animate w-full max-w-md border-border bg-card/70 backdrop-blur-xl shadow-2xl">
                    <AnimatePresence mode="wait">
                        {step === 'form' ? (
                            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <CardHeader className="space-y-1 text-center pb-8">
                                    <CardTitle className="text-3xl font-black tracking-tight text-foreground">Create account</CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Join the premium payment network
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="grid gap-5">
                                    <form onSubmit={handleRegister} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</Label>
                                            <div className="relative group">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
                                                <Input
                                                    placeholder="John Doe"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="pl-10 bg-background/50 border-border text-foreground h-12 rounded-xl"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Phone</Label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
                                                    <Input
                                                        placeholder="+91..."
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                        className="pl-10 bg-background/50 border-border text-foreground h-12 rounded-xl"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Purpose</Label>
                                                <Select value={purpose} onValueChange={setPurpose}>
                                                    <SelectTrigger className="bg-background/50 border-border text-foreground h-12 rounded-xl focus:ring-violet-500/20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card border-border">
                                                        <SelectItem value="Website">Website</SelectItem>
                                                        <SelectItem value="Business">Business</SelectItem>
                                                        <SelectItem value="Freelance">Freelance</SelectItem>
                                                        <SelectItem value="Personal">Personal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Email</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
                                                <Input
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pl-10 bg-background/50 border-border text-foreground h-12 rounded-xl"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Password</Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="pl-10 pr-10 bg-background/50 border-border text-foreground h-12 rounded-xl"
                                                    required
                                                />
                                                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button disabled={loading} type="submit" className="w-full h-12 mt-4 rounded-xl bg-violet-600 text-white hover:bg-violet-500 font-bold transition-all shadow-lg shadow-violet-600/20 border-none">
                                            {loading ? 'Processing...' : 'Create Account'}
                                            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                                        </Button>
                                    </form>
                                </CardContent>
                            </motion.div>
                        ) : (
                            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <CardHeader className="space-y-2 text-center pb-8">
                                    <div className="w-16 h-16 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                                        <ShieldCheck className="text-violet-500" size={32} />
                                    </div>
                                    <CardTitle className="text-2xl font-black text-foreground">Verify Identity</CardTitle>
                                    <CardDescription className="text-zinc-500 text-sm leading-relaxed">
                                        We've sent a 6-digit cryptographic code to <br />
                                        <span className="text-violet-500 font-bold">{email}</span>
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="grid gap-6 pb-8">
                                    <form onSubmit={handleVerifyOtp} className="grid gap-6">
                                        <div className="grid gap-4">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center block">Security Code</Label>
                                            <div className="flex justify-between gap-2">
                                                {otp.map((digit, index) => (
                                                    <input
                                                        key={index}
                                                        ref={(el) => (inputRefs.current[index] = el)}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                                        className="w-full h-14 text-center text-xl font-black bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <Button disabled={loading} type="submit" className="w-full h-12 rounded-xl bg-violet-600 text-white hover:bg-violet-500 font-bold shadow-lg shadow-violet-600/20 border-none">
                                            {loading ? 'Verifying...' : 'Verify & Sign Up'}
                                        </Button>
                                    </form>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <div className="text-center text-xs text-zinc-500">
                                            Didn't receive code?{' '}
                                            <button onClick={handleRegister} className="text-violet-500 hover:underline font-bold">Resend OTP</button>
                                        </div>
                                        <Button variant="ghost" onClick={() => setStep('form')} className="text-zinc-500 hover:text-foreground text-xs font-bold">
                                            Change email address
                                        </Button>
                                    </div>
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </section>
    );
}
