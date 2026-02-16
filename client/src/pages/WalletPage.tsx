import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/AuthContext';
import { Send as SendIcon, QrCode, ArrowDownToLine, Copy, Check } from 'lucide-react';
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
                {/* Page Header */}
                <div className="px-6 py-4 bg-card/10 backdrop-blur-md border-b border-border/40">
                    <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                        <div>
                            <h1 className="text-lg font-black text-foreground tracking-tight uppercase">Financial Hub</h1>
                            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-[0.2em] opacity-70">INR Control Center</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
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
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <button
                            onClick={() => checkPinAndNavigate('/scan')}
                            className="border-pane py-10 transition-all text-center group hover:bg-violet-500/[0.02]"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <QrCode size={20} className="text-violet-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground mb-1.5">Scan QR</h3>
                            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Execute instant node transfers via QR uplink.</p>
                        </button>

                        <button
                            onClick={() => checkPinAndNavigate('/send')}
                            className="border-pane py-8 transition-all text-center group hover:bg-emerald-500/[0.02]"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <SendIcon size={20} className="text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground mb-1.5">Send INR</h3>
                            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Liquidity injection to any secure Zen ID.</p>
                        </button>

                        <button
                            onClick={() => checkPinAndNavigate('/receive')}
                            className="border-pane py-8 transition-all text-center group hover:bg-violet-500/[0.02]"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <QrCode size={20} className="text-violet-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground mb-1.5">Receive Money</h3>
                            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Generate identity links for incoming node transfers.</p>
                        </button>

                        <button
                            onClick={() => checkPinAndNavigate('/payment')}
                            className="border-pane py-8 transition-all text-center group hover:bg-muted/10"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowDownToLine size={20} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground mb-1.5">Add INR</h3>
                            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[140px] mx-auto font-medium italic">Inject liquidity into your global node instantly.</p>
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
