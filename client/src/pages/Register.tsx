import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Wallet, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(email, password, fullName);
        } catch (err) {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-slate-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex justify-center mb-8">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
                        <Wallet size={40} className="text-white" />
                    </div>
                </div>

                <div className="glass-card p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
                    <p className="text-slate-400 text-center mb-8">Join ZenWallet and start earning coins</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="input-field pl-10"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="input-field pl-10"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Get Started'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-8 text-center text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
