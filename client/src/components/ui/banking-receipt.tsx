import React, { useRef } from 'react';
import {
    Check,
    Download,
    Share2,
    Lock,
    QrCode,
    Copy,
    ShieldCheck,
    ArrowRight,
    User
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from './button';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { useAuth } from '@/AuthContext';

export interface TransactionData {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    sender_upi_id?: string;
    receiver_name: string;
    receiver_upi_id?: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    created_at: string;
    reference_id?: string;
    type?: string;
}

interface BankingReceiptProps {
    transaction: TransactionData;
    onClose: () => void;
}

export const BankingReceipt: React.FC<BankingReceiptProps> = ({ transaction, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Derived values
    const isSuccess = transaction.status === 'SUCCESS';
    const transactionDate = new Date(transaction.created_at);
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).format(transactionDate);

    // Mock data for realism
    const processingFee = 0;
    const totalDebited = transaction.amount + processingFee;
    const utrNumber = transaction.id.replace(/-/g, '').toUpperCase().slice(0, 12); // Mock UTR from ID
    const paymentMode = transaction.type === 'TRANSFER' ? 'IMPS' : 'UPI';
    const bankName = "ZenWallet Payment Bank"; // Mock bank

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} Copied`);
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: null,
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `ZenWallet-Receipt-${transaction.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success("Receipt Downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download receipt");
        }
    };

    const handleShare = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: null,
                scale: 2
            });
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], `receipt.png`, { type: 'image/png' });
                    if (navigator.share) {
                        try {
                            await navigator.share({
                                title: 'Payment Receipt',
                                text: `Transaction ID: ${transaction.id}`,
                                files: [file]
                            });
                        } catch (shareErr) {
                            console.log('Share canceled or failed', shareErr);
                        }
                    } else {
                        const text = `ZenWallet Transaction Details:\nAmount: ₹${transaction.amount}\nRef: ${transaction.id}\nStatus: ${transaction.status}`;
                        await navigator.clipboard.writeText(text);
                        toast.success("Details copied to clipboard");
                    }
                }
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to share receipt");
        }
    };

    return (
        <div ref={receiptRef} className="w-full max-w-4xl bg-card text-foreground rounded-none shadow-2xl overflow-hidden relative flex flex-col md:flex-row items-stretch border border-border/10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Left Panel: Branding & Status */}
            <div className="w-full md:w-2/5 bg-muted/30 border-r border-border/30 p-8 flex flex-col justify-between relative">
                <div className="w-2 h-full bg-primary absolute left-0 top-0" />

                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-foreground text-background rounded-[2px] flex items-center justify-center text-[10px] font-black">Z</div>
                        <span className="text-xs font-black tracking-widest text-foreground uppercase">ZEN PROTOCOL</span>
                    </div>

                    <div className="space-y-2">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center ring-4 ring-primary/5 mb-4">
                            <Check strokeWidth={3} size={28} />
                        </div>

                        <h2 className="text-3xl font-black text-foreground tracking-tight uppercase leading-none">
                            Payment<br />Successful
                        </h2>
                        <p className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase opacity-60">
                            Ref No: <span className="font-mono text-foreground">{transaction.id.slice(0, 18)}</span>
                        </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-xl border border-border/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={14} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Holder</p>
                                <p className="text-xs font-bold text-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 mt-12">
                    <div>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block mb-2 opacity-60">Total Amount</span>
                        <div className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                            ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/20">
                        <div>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block mb-1 opacity-60">Date</span>
                            <span className="text-sm font-bold text-foreground">{formattedDate.split(',')[0]}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block mb-1 opacity-60">Time</span>
                            <span className="text-sm font-bold text-foreground">{formattedDate.split(',')[1]}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Transaction Details */}
            <div className="w-full md:w-3/5 p-8 bg-card flex flex-col">
                <div className="flex-1 space-y-8">

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Sender */}
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest block mb-2 opacity-60">Debited From</span>
                            <div className="space-y-0.5">
                                <p className="font-semibold text-foreground text-sm">{user?.full_name || 'You'}</p>
                                <div className="flex items-center gap-2 group cursor-pointer w-fit" onClick={() => handleCopy(user?.upi_id || '', 'ZenWallet ID')}>
                                    <p className="text-[11px] font-mono text-muted-foreground">{user?.upi_id || 'Not Available'}</p>
                                    <Copy size={10} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Receiver */}
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest block mb-2 opacity-60">Credited To</span>
                            <div className="space-y-0.5">
                                <p className="font-semibold text-foreground text-sm">{transaction.receiver_name || transaction.receiver_id || 'Unknown'}</p>
                                <div className="flex items-center gap-2 group cursor-pointer w-fit" onClick={() => handleCopy(transaction.receiver_upi_id || transaction.receiver_id || '', 'ZenWallet ID')}>
                                    <p className="text-[11px] font-mono text-muted-foreground">{transaction.receiver_upi_id || transaction.receiver_id || 'Not Available'}</p>
                                    <Copy size={10} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-muted/20 rounded-xl p-6 border border-border/30">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-bold tracking-wide">Transfer Amount</span>
                                <span className="font-bold text-foreground">₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-bold tracking-wide">Network Fee</span>
                                <span className="font-bold text-primary">Waived</span>
                            </div>
                            <div className="h-px bg-border/20 my-2" />
                            <div className="flex justify-between text-sm">
                                <span className="font-black text-foreground">Total Debited</span>
                                <span className="font-black text-foreground">₹{totalDebited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block mb-1 opacity-60">UTR Number</span>
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleCopy(utrNumber, 'UTR')}>
                                <span className="font-mono text-sm font-bold text-foreground">{utrNumber}</span>
                                <Copy size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block mb-1 opacity-60">Payment Mode</span>
                            <span className="font-bold text-sm text-foreground">{paymentMode} - Secure</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-8 mt-8 border-t border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Verified</span>
                            <span className="text-[9px] text-emerald-500/70 font-bold">ZenProtocol Signature</span>
                        </div>
                    </div>

                    <div className="flex gap-3" data-html2canvas-ignore>
                        <button
                            onClick={handleShare}
                            className="h-10 px-4 flex items-center justify-center border border-border bg-muted/30 rounded-lg text-foreground hover:bg-muted/50 transition-colors text-xs font-black uppercase tracking-wide"
                        >
                            <Share2 size={14} className="mr-2" /> Share
                        </button>
                        <Button
                            onClick={handleDownload}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-10 rounded-lg shadow-lg shadow-primary/20 border-none text-xs uppercase tracking-wide px-6"
                        >
                            <Download size={14} className="mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
