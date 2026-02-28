import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/AuthContext';
import { Send as SendIcon, QrCode, ArrowDownToLine, Copy, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wallet() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (user?.upi_id) {
            navigator.clipboard.writeText(user.upi_id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const checkPinAndNavigate = (path: string) => {
        if (!user?.hasPaymentPin) {
            toast.error('Please setup your Payment PIN first');
            navigate('/setup-pin');
            return;
        }
        navigate(path);
    };

    return (
        <AppLayout>
            <div className="h-full w-full overflow-y-auto">
                {/* Desktop View (Unchanged) */}
                <div className="hidden lg:block">
                    <div className="px-6 py-4 bg-card/10 backdrop-blur-md border-b border-border/40">
                        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                            <div>
                                <h1 className="text-lg font-black text-foreground tracking-tight uppercase">Financial Hub</h1>
                                <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-[0.2em] opacity-70">INR Control Center</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="border-pane px-6 py-5 flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 bg-muted border border-border/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl">
                                    <QrCode className="text-muted-foreground" size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-muted-foreground font-black mb-2 uppercase tracking-[0.25em] opacity-70">Global Node Identifier</p>
                                    <p className="text-lg text-foreground font-black tracking-tight uppercase">{user?.upi_id || 'Generating...'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-foreground/5"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copy' : 'Copy'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                            <button onClick={() => checkPinAndNavigate('/scan')} className="border-pane py-10 transition-all text-center group hover:bg-violet-500/[0.02]">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/5 flex items-center justify-center group-hover:scale-110 transition-transform"><QrCode size={20} className="text-violet-400" /></div>
                                <h3 className="text-sm font-bold text-foreground mb-1.5">Scan QR</h3>
                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Execute instant node transfers via QR uplink.</p>
                            </button>
                            <button onClick={() => checkPinAndNavigate('/send')} className="border-pane py-8 transition-all text-center group hover:bg-emerald-500/[0.02]">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/5 flex items-center justify-center group-hover:scale-110 transition-transform"><SendIcon size={20} className="text-emerald-500" /></div>
                                <h3 className="text-sm font-bold text-foreground mb-1.5">Send INR</h3>
                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Liquidity injection to any secure Zen ID.</p>
                            </button>
                            <button onClick={() => checkPinAndNavigate('/receive')} className="border-pane py-8 transition-all text-center group hover:bg-violet-500/[0.02]">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/5 flex items-center justify-center group-hover:scale-110 transition-transform"><QrCode size={20} className="text-violet-400" /></div>
                                <h3 className="text-sm font-bold text-foreground mb-1.5">Receive Money</h3>
                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Generate identity links for incoming node transfers.</p>
                            </button>
                            <button onClick={() => checkPinAndNavigate('/payment')} className="border-pane py-8 transition-all text-center group hover:bg-muted/10">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform"><ArrowDownToLine size={20} className="text-muted-foreground" /></div>
                                <h3 className="text-sm font-bold text-foreground mb-1.5">Add INR</h3>
                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Inject liquidity into your global node instantly.</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile View (Premium Refined) */}
                <div className="block lg:hidden px-6 pb-20 pt-4 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* Cloud Node Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full opacity-20 pointer-events-none" />
                        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                        <QrCode className="text-primary" size={24} />
                                    </div>
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Network Identity</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Pay ID</p>
                                    <p className="text-2xl font-black text-white tracking-widest break-all">
                                        {user?.upi_id || 'GENERATING...'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="w-full h-14 bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                >
                                    {copied ? <Check className="text-emerald-500" size={18} /> : <Copy className="text-zinc-500" size={18} />}
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {copied ? 'Copied Link' : 'Copy Pay ID'}
                                    </span>
                                </button>
                            </div>
                            <div className="absolute -top-10 -right-10 size-40 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
                        </div>
                    </div>

                    {/* Action Hub */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-2">Financial Operations</p>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { path: '/scan', icon: <QrCode size={22} />, label: 'Scan to Settle', color: 'text-violet-400', bg: 'bg-violet-400/10' },
                                { path: '/send', icon: <SendIcon size={22} />, label: 'Push Liquidity', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                { path: '/receive', icon: <QrCode size={22} />, label: 'Pull Node Link', color: 'text-primary', bg: 'bg-primary/10' },
                                { path: '/payment', icon: <ArrowDownToLine size={22} />, label: 'Inject INR', color: 'text-zinc-400', bg: 'bg-white/5' }
                            ].map((act) => (
                                <button
                                    key={act.path}
                                    onClick={() => checkPinAndNavigate(act.path)}
                                    className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-3xl active:scale-[0.98] active:bg-white/[0.05] transition-all"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`size-12 rounded-2xl ${act.bg} flex items-center justify-center ${act.color}`}>
                                            {act.icon}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white uppercase tracking-wider">{act.label}</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5">Authorized Action</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-zinc-700" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
