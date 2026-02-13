import * as React from "react";
import { cn } from "@/lib/utils";

// --- SVG Icons ---

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="M6 6 18 18" />
    </svg>
);

const ConfettiExplosion = () => {
    const confettiCount = 80;
    const colors = ["#818cf8", "#34d399", "#f87171", "#fbbf24", "#a78bfa"];

    return (
        <>
            <style>
                {`
          @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
          }
        `}
            </style>
            <div className="fixed inset-0 z-[110] pointer-events-none" aria-hidden="true">
                {Array.from({ length: confettiCount }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-3"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${-10 + Math.random() * 5}%`,
                            backgroundColor: colors[i % colors.length],
                            borderRadius: '2px',
                            transform: `rotate(${Math.random() * 360}deg)`,
                            animation: `fall ${2 + Math.random() * 2}s ${Math.random() * 1}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                        }}
                    />
                ))}
            </div>
        </>
    );
};


// --- Main Ticket Component ---

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
    ticketId: string;
    amount: number;
    date: Date;
    receiverTitle: string;
    currency?: string;
    status?: string;
}

const AnimatedTicket = React.forwardRef<HTMLDivElement, TicketProps>(
    (
        {
            className,
            ticketId,
            amount,
            date,
            receiverTitle,
            currency = "INR",
            status = "SUCCESS",
            ...props
        },
        ref
    ) => {
        const [showConfetti, setShowConfetti] = React.useState(false);

        React.useEffect(() => {
            if (status === "SUCCESS") {
                setShowConfetti(true);
                const timer = setTimeout(() => setShowConfetti(false), 5000);
                return () => clearTimeout(timer);
            }
        }, [status]);

        const formattedAmount = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);

        const formattedDate = new Intl.DateTimeFormat("en-IN", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);

        const isSuccess = status === "SUCCESS";

        return (
            <>
                {showConfetti && <ConfettiExplosion />}
                <div
                    ref={ref}
                    className={cn(
                        "relative w-full max-w-[320px] bg-card text-foreground rounded-[2rem] font-sans overflow-hidden border border-border shadow-2xl",
                        "animate-in fade-in zoom-in duration-500",
                        className
                    )}
                    {...props}
                >
                    {/* Top Status Header */}
                    <div className={cn(
                        "p-10 flex flex-col items-center text-center pb-8",
                        isSuccess ? "bg-emerald-500/5" : "bg-destructive/5"
                    )}>
                        <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center mb-6 transition-transform duration-500",
                            isSuccess ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30" : "bg-destructive text-destructive-foreground shadow-2xl shadow-destructive/30"
                        )}>
                            {isSuccess ? <CheckCircleIcon className="w-8 h-8" /> : <XCircleIcon className="w-8 h-8" />}
                        </div>

                        <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-foreground">
                            {isSuccess ? "Payment Approved" : "Transaction Failed"}
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-70">
                            {isSuccess ? "Securely Transmitted" : "Network Rejection"}
                        </p>
                    </div>

                    {/* Ticket Body */}
                    <div className="px-8 pb-8 pt-0 space-y-6 relative bg-card">

                        <div className="border-t-2 border-dashed border-border/60 pt-8 space-y-8">
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-3 opacity-60">Beneficiary</span>
                                <span className="text-lg font-bold truncate max-w-full text-center px-1 tracking-tight text-foreground">{receiverTitle}</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-2 opacity-60">Total Amount</span>
                                <span className="text-5xl font-black tracking-tighter text-foreground tabular-nums flex items-start gap-1">
                                    <span className="text-2xl mt-1 opacity-40">₹</span>
                                    {amount.toLocaleString()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/40">
                                <div className="space-y-1.5">
                                    <span className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em] block opacity-60">Reference ID</span>
                                    <span className="text-[10px] font-mono text-foreground font-bold uppercase break-all block tracking-widest">{ticketId}</span>
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <span className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em] block opacity-60">Timestamp</span>
                                    <span className="text-[10px] font-bold text-foreground block uppercase tracking-wide">{formattedDate.split(',')[0]}</span>
                                    <span className="text-[9px] font-medium text-muted-foreground block uppercase">{formattedDate.split(',')[1]}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div className="py-5 bg-muted/30 flex flex-col items-center border-t border-border">
                        <div className="flex items-center gap-2 opacity-40 transition-opacity hover:opacity-100 group cursor-help">
                            <div className="h-5 w-5 bg-primary text-primary-foreground rounded-md flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform">Z</div>
                            <span className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground">Verified by Zen</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }
);

AnimatedTicket.displayName = "AnimatedTicket";

export { AnimatedTicket };
