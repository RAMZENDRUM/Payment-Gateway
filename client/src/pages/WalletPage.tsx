import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/AuthContext';
import { Send as SendIcon, QrCode, ArrowDownToLine, Copy, Check } from 'lucide-react';

export default function Wallet() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (user?.wallet_id) {
            navigator.clipboard.writeText(user.wallet_id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AppLayout>
            <div className="h-full w-full overflow-y-auto">
                {/* Page Header */}
                <div className="px-8 py-5 bg-[#0f0f10] border-b border-slate-800/30">
                    <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight">Wallet</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Manage your wallet and make transfers</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-8 py-6 max-w-[1600px] mx-auto">
                    {/* Wallet ID Card */}
                    <div className="bg-[#13131a] rounded-md px-5 py-4 border border-slate-800/30 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Wallet ID</p>
                                <p className="text-sm text-white font-mono">{user?.wallet_id || '---'}</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/send')}
                            className="bg-[#13131a] rounded-md px-6 py-8 border border-slate-800/30 hover:border-cyan-500/30 hover:bg-slate-800/20 transition-all text-center group"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                <SendIcon size={20} className="text-cyan-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-white mb-1">Send</h3>
                            <p className="text-xs text-slate-500">Transfer to another wallet</p>
                        </button>

                        <button
                            onClick={() => navigate('/receive')}
                            className="bg-[#13131a] rounded-md px-6 py-8 border border-slate-800/30 hover:border-cyan-500/30 hover:bg-slate-800/20 transition-all text-center group"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                <QrCode size={20} className="text-cyan-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-white mb-1">Receive</h3>
                            <p className="text-xs text-slate-500">Generate QR code</p>
                        </button>

                        <button
                            onClick={() => navigate('/payment')}
                            className="bg-[#13131a] rounded-md px-6 py-8 border border-slate-800/30 hover:border-cyan-500/30 hover:bg-slate-800/20 transition-all text-center group"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                <ArrowDownToLine size={20} className="text-cyan-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-white mb-1">Top-up</h3>
                            <p className="text-xs text-slate-500">Add funds to wallet</p>
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
