import * as React from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

// --- PROPS INTERFACE ---
interface FlippableCreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    spending?: number;
}

const FlippableCreditCard = React.forwardRef<HTMLDivElement, FlippableCreditCardProps>(
    ({ className, cardholderName, cardNumber, expiryDate, cvv, spending = 0, ...props }, ref) => {
        const [isFlipped, setIsFlipped] = React.useState(false);

        const handleCardClick = (e: React.MouseEvent) => {
            if (!props.id?.includes('locked')) {
                setIsFlipped(!isFlipped);
            }
        };

        const getCardTheme = () => {
            if (spending >= 1000000) return {
                bgColor: "#000000",
                border: "border-yellow-400/50 shadow-[0_0_25px_rgba(250,204,21,0.4)]",
                glow: "after:content-[''] after:absolute after:inset-0 after:rounded-[1.5rem] after:shadow-[inset_0_0_15px_rgba(250,204,21,0.3)]"
            };
            if (spending >= 800000) return { bgColor: "#022c22", border: "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]" };
            if (spending >= 600000) return { bgColor: "#2a0a0a", border: "border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.25)]" };
            if (spending >= 400000) return { bgColor: "#0f0a22", border: "border-violet-500/40 shadow-[0_0_25px_rgba(139,92,246,0.25)]" };
            if (spending >= 300000) return { bgColor: "#0a1c12", border: "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]" };
            if (spending >= 200000) return { bgColor: "#180a0a", border: "border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.25)]" };
            if (spending >= 100000) return { bgColor: "#1a0b0b", border: "border-orange-500/40 shadow-[0_0_25px_rgba(249,115,22,0.25)]" };
            return { bgColor: "#09090b", border: "border-white/10 shadow-lg" };
        };

        const theme = getCardTheme();

        const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
            e.stopPropagation();
            if (!text || text.includes('•')) return;
            navigator.clipboard.writeText(text.replace(/\s/g, ''));
            toast.success(`${label} copied!`, {
                icon: <Check className="h-4 w-4 text-emerald-500" />,
                style: {
                    borderRadius: '12px',
                    background: '#09090b',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '12px'
                },
            });
        };

        return (
            <div
                className={cn("group h-40 w-64 [perspective:1000px] cursor-pointer", className)}
                ref={ref}
                onClick={handleCardClick}
                {...props}
            >
                <div
                    className={cn(
                        "relative h-full w-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d]",
                        isFlipped && "[transform:rotateY(180deg)]"
                    )}
                >
                    {/* --- CARD FRONT --- */}
                    <div
                        className={cn(
                            "absolute h-full w-full rounded-2xl transition-all duration-500 text-white [backface-visibility:hidden] border p-[1px]",
                            theme.border,
                            (theme as any).glow
                        )}
                        style={{ backgroundColor: theme.bgColor }}
                    >
                        <div className="relative flex h-full flex-col justify-between p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400">ZENWALLET</span>
                                    <span className="text-[7px] font-bold text-violet-500/80">SECURE VIRTUAL NODE</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
                                        <circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10" />
                                        <path d="M25 10 L25 40 M10 25 L40 25" stroke="currentColor" strokeWidth="1" className="text-violet-500/30" />
                                        <rect x="15" y="15" width="20" height="20" rx="4" fill="currentColor" className="text-violet-500/20" />
                                    </svg>
                                    {!props.id?.includes('locked') && (
                                        <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-tighter animate-pulse">Click card to Flip</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={(e) => copyToClipboard(cardNumber, "Card number", e)}
                                    className="group/copy px-4 py-2 hover:bg-white/[0.03] rounded-xl transition-all relative border border-transparent hover:border-white/5"
                                >
                                    <div className="font-mono text-sm tracking-[0.18em] text-slate-200 whitespace-nowrap group-hover/copy:text-white transition-colors">
                                        {cardNumber}
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/copy:opacity-100 transition-all flex items-center gap-1">
                                        <span className="text-[6px] font-bold text-violet-500 uppercase tracking-widest">Click to copy</span>
                                        <Copy size={6} className="text-violet-500" />
                                    </div>
                                </button>
                            </div>

                            <div className="flex items-end justify-between">
                                <button
                                    onClick={(e) => copyToClipboard(cardholderName, "Holder name", e)}
                                    className="text-left group/copy p-1.5 hover:bg-white/[0.03] rounded-lg transition-all border border-transparent hover:border-white/5 relative"
                                >
                                    <p className="text-[7px] font-bold uppercase text-slate-600 tracking-widest mb-0.5">Card Holder</p>
                                    <p className="font-mono text-[9px] font-medium text-slate-300 group-hover/copy:text-white transition-colors">{cardholderName}</p>
                                    <Copy size={6} className="absolute top-1 right-1 opacity-0 group-hover/copy:opacity-100 text-violet-500" />
                                </button>
                                <button
                                    onClick={(e) => copyToClipboard(expiryDate, "Expiry date", e)}
                                    className="text-right group/copy p-1.5 hover:bg-white/[0.03] rounded-lg transition-all border border-transparent hover:border-white/5 relative"
                                >
                                    <p className="text-[7px] font-bold uppercase text-slate-600 tracking-widest mb-0.5">Expires</p>
                                    <p className="font-mono text-[9px] font-medium text-slate-300 group-hover/copy:text-white transition-colors">{expiryDate}</p>
                                    <Copy size={6} className="absolute top-1 left-1 opacity-0 group-hover/copy:opacity-100 text-violet-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- CARD BACK --- */}
                    <div
                        className={cn(
                            "absolute h-full w-full rounded-2xl transition-all duration-500 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] border",
                            theme.border
                        )}
                        style={{ backgroundColor: theme.bgColor }}
                    >
                        <div className="flex h-full flex-col">
                            <div className="mt-4 h-8 w-full bg-zinc-800/80" />
                            <div className="mx-4 mt-4 flex justify-end">
                                <button
                                    onClick={(e) => copyToClipboard(cvv, "CVV", e)}
                                    className="group/copy bg-white h-6 w-10 flex items-center justify-center rounded relative"
                                >
                                    <span className="font-mono text-[10px] text-zinc-900 font-bold">{cvv}</span>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/copy:opacity-100 transition-all flex items-center gap-1 whitespace-nowrap">
                                        <span className="text-[6px] font-bold text-violet-400 uppercase tracking-widest">Copy CVV</span>
                                        <Copy size={6} className="text-violet-400" />
                                    </div>
                                </button>
                            </div>
                            <div className="mt-auto p-4 flex justify-between items-center">
                                <div className="text-slate-500 text-[6px] font-medium leading-tight max-w-[120px]">
                                    This card is issued by ZenWallet for sandbox testing. Authorized use only.
                                </div>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                    <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z" />
                                    <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z" />
                                    <path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48C20.376,15.05,18,19.245,18,24z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

FlippableCreditCard.displayName = "FlippableCreditCard";

export { FlippableCreditCard };
