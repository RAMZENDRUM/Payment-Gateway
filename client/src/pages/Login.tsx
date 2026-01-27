"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from '../AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Eye,
    EyeOff,
    Github,
    Lock,
    Mail,
    ArrowRight,
    Chrome,
} from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if there's a return URL in state (from PrivateRoute)
    // The state structure from PrivateRoute is { from: Location object }
    // We want to reconstruct pathname + search query
    const fromState = location.state?.from;
    const redirectPath = fromState
        ? `${fromState.pathname}${fromState.search}`
        : '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Yield to main thread to allow UI to update (show loading spinner)
        setTimeout(async () => {
            try {
                setErrorMsg('');
                setNeedsVerification(false);
                await login(email, password);
                navigate(redirectPath, { replace: true });
            } catch (err: any) {
                setLoading(false);
                setErrorMsg(err.response?.data?.message || 'Login failed');
                if (err.response?.data?.needsVerification) {
                    setNeedsVerification(true);
                }
            }
        }, 50);
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
            if (loading) {
                raf = requestAnimationFrame(draw);
                return;
            }
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
    }, [loading]);

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

        /* === Card minimal fade-up animation === */
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

            {/* Subtle vignette */}
            <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />

            {/* Animated accent lines */}
            <div className="accent-lines">
                <div className="hline" />
                <div className="hline" />
                <div className="hline" />
                <div className="vline" />
                <div className="vline" />
                <div className="vline" />
            </div>

            {/* Particles */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none"
            />

            {/* Header */}
            <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-8 py-6 border-b border-zinc-800/80 z-10">
                <span className="text-sm font-bold tracking-[0.14em] uppercase text-zinc-300">
                    ZENWALLET
                </span>
                <Button
                    variant="outline"
                    className="h-10 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <span className="mr-2 text-sm">Contact Support</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </header>

            {/* Centered Login Card */}
            <div className="min-h-screen h-full w-full grid place-items-center px-4 relative z-10 py-20">
                <Card className="card-animate w-full max-w-[440px] border-zinc-800 bg-zinc-900/90 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-3 pb-8">
                        <CardTitle className="text-3xl font-bold tracking-tight text-white">Welcome back</CardTitle>
                        <CardDescription className="text-base text-zinc-400">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-6">
                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                                {errorMsg}
                                {needsVerification && (
                                    <div className="mt-2 text-zinc-200">
                                        Lost your OTP? <Link to="/register" className="text-white hover:underline font-bold">Restart registration here →</Link>
                                    </div>
                                )}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="grid gap-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="email" className="text-[15px] font-medium text-zinc-300">
                                    Email address
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-11 h-12 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="password" className="text-[15px] font-medium text-zinc-300">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-11 pr-11 h-12 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 text-base"
                                        required
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2.5">
                                    <Checkbox
                                        id="remember"
                                        className="border-zinc-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 w-5 h-5 rounded-[4px]"
                                    />
                                    <Label htmlFor="remember" className="text-sm text-zinc-400 font-normal cursor-pointer">
                                        Remember me
                                    </Label>
                                </div>
                                <Link to="/forgot-password" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button disabled={loading} type="submit" className="w-full h-12 text-base font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-950/50">
                                {loading ? 'Signing in...' : 'Sign in to account'}
                            </Button>
                        </form>

                        <div className="relative my-2">
                            <Separator className="bg-zinc-800" />
                            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-zinc-900 px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                                Or continue with
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-11 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all hover:border-zinc-700"
                            >
                                <Github className="h-5 w-5 mr-2.5" />
                                GitHub
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all hover:border-zinc-700"
                            >
                                <Chrome className="h-5 w-5 mr-2.5" />
                                Google
                            </Button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
                        <div className="text-center text-sm text-zinc-500">
                            Don't have an account yet?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
                                Sign up now
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </section >
    );
}
