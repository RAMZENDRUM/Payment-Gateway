import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Lock, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            toast.success('Reset code sent');
            setStep(2);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Move to next box if value is entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length !== 6) return toast.error('Enter 6-digit code');
        setStep(3);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                email,
                otp: otp.join(''),
                newPassword
            });
            toast.success('Password reset successful');
            setStep(4);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="fixed inset-0 bg-background text-foreground overflow-hidden flex flex-col items-center justify-center px-4 transition-colors duration-300">
            {/* Immersive background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:opacity-40" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-foreground transition-all mb-10 text-[10px] font-bold uppercase tracking-widest group bg-transparent border-none outline-none cursor-pointer p-0"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to previous page
                </button>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
                                    Restore <span className="text-violet-500">Access.</span>
                                </h1>
                                <p className="text-sm text-zinc-500 font-medium">Verify your identity to regain control of your account.</p>
                            </div>

                            <form onSubmit={handleRequestOtp} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Registered Email</label>
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 bg-card border-border rounded-2xl text-foreground placeholder:text-zinc-600 focus:ring-violet-500/20 focus:border-violet-500/40 transition-all font-medium"
                                        leftIcon={<Mail size={18} className="text-zinc-500" />}
                                        required
                                    />
                                </div>
                                <Button loading={loading} className="w-full h-14 bg-violet-600 text-white font-bold text-sm rounded-2xl hover:bg-violet-500 shadow-xl shadow-violet-500/20 transition-all border-none">
                                    Send Verification Code
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 text-center">
                            <div className="space-y-2">
                                <div className="h-16 w-16 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                                    <ShieldCheck size={32} className="text-violet-500" />
                                </div>
                                <h1 className="text-2xl font-black text-foreground tracking-tight">Check your device.</h1>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                    We've sent a 6-digit cryptographic code to <br />
                                    <span className="text-violet-500 font-bold">{email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center block">Security Code</label>
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
                                                className="w-12 h-16 text-center text-2xl font-black bg-card border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <Button className="w-full h-14 bg-violet-600 dark:bg-white text-white dark:text-black font-bold text-sm rounded-2xl hover:bg-violet-500 dark:hover:bg-zinc-200 transition-all border-none">
                                    Authorize Account
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-foreground tracking-tight">New Credentials.</h1>
                                <p className="text-sm text-zinc-500 font-medium">Create a strong, unique password for your security.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">New Password</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-14 bg-card border-border rounded-2xl text-foreground"
                                            leftIcon={<Lock size={18} className="text-zinc-500" />}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Confirm Identity</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-14 bg-card border-border rounded-2xl text-foreground"
                                            leftIcon={<Lock size={18} className="text-zinc-500" />}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button loading={loading} className="w-full h-14 bg-violet-600 text-white font-bold text-sm rounded-2xl hover:bg-violet-500 shadow-xl shadow-violet-500/20 transition-all border-none mt-4">
                                    Finalize Reset
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
                            <div className="relative inline-block">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="h-24 w-24 bg-emerald-500/10 rounded-[40px] flex items-center justify-center border border-emerald-500/20"
                                >
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                </motion.div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-10px] border border-dashed border-emerald-500/20 rounded-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">System Synchronized.</h1>
                                <p className="text-sm text-zinc-500 font-medium">Your account state has been updated with the new credentials.</p>
                            </div>
                            <Button onClick={() => navigate('/login')} className="w-full h-14 bg-violet-600 dark:bg-white text-white dark:text-black font-bold text-sm rounded-2xl hover:bg-violet-500 dark:hover:bg-zinc-200 transition-all border-none">
                                Return to Dashboard
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Subtle footer */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">ZenWallet Secure Identity Gateway</p>
            </div>
        </section>
    );
}
