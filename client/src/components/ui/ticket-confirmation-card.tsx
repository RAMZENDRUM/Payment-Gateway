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
        strokeWidth="3"
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
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
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
                        "relative w-full max-w-[280px] bg-white/[0.03] backdrop-blur-3xl text-white rounded-[2.5rem] font-sans overflow-hidden border border-white/[0.05]",
                        "animate-in fade-in zoom-in duration-500",
                        className
                    )}
                    {...props}
                >
                    {/* Top Status Header */}
                    <div className={cn(
                        "p-8 flex flex-col items-center text-center",
                        isSuccess ? "bg-emerald-500/[0.02]" : "bg-red-500/[0.02]"
                    )}>
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-transform duration-500",
                            isSuccess ? "bg-emerald-500 shadow-2xl shadow-emerald-500/20" : "bg-red-500 shadow-2xl shadow-red-500/20"
                        )}>
                            {isSuccess ? <CheckCircleIcon className="text-black w-6 h-6" /> : <XCircleIcon className="text-white w-6 h-6" />}
                        </div>

                        <h2 className="text-xl font-medium tracking-tighter mb-1 uppercase">
                            {isSuccess ? "Approved" : "Denied"}
                        </h2>
                        <p className="text-[10px] text-zinc-600 font-medium tracking-[3px] uppercase">
                            {isSuccess ? "Transaction Secure" : "Protocol Failed"}
                        </p>
                    </div>

                    {/* Ticket Body */}
                    <div className="px-8 py-4 space-y-4 relative">
                        {/* Decorative Punch Holes blending with global bg */}
                        <div className="absolute -left-3 top-[-10px] w-6 h-6 rounded-full bg-[#08090b]" />
                        <div className="absolute -right-3 top-[-10px] w-6 h-6 rounded-full bg-[#08090b]" />

                        <div className="border-t border-dashed border-white/[0.05] pt-6 space-y-4">
                            <div className="flex flex-col items-center py-1">
                                <span className="text-[9px] text-zinc-600 font-medium uppercase tracking-[3px] mb-2">Destination</span>
                                <span className="text-base font-medium truncate max-w-full text-center px-1 tracking-tight">{receiverTitle}</span>
                            </div>

                            <div className="flex flex-col items-center pb-4">
                                <span className="text-[9px] text-zinc-600 font-medium uppercase tracking-[3px] mb-2">Quantity</span>
                                <span className="text-4xl font-medium tracking-tighter text-white tabular-nums">{formattedAmount}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/[0.02]">
                                <div className="space-y-1">
                                    <span className="text-[8px] text-zinc-700 font-medium uppercase tracking-[2px] block">Node Path</span>
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase break-all block">{ticketId}</span>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[8px] text-zinc-700 font-medium uppercase tracking-[2px] block">Timestamp</span>
                                    <span className="text-[10px] font-medium text-zinc-500 block uppercase">{formattedDate.split(',')[0]}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div className="py-6 flex flex-col items-center">
                        <div className="flex items-center gap-2 opacity-20 transition-opacity hover:opacity-50">
                            <div className="h-4 w-4 bg-white text-black rounded-lg flex items-center justify-center text-[8px] font-black">Z</div>
                            <span className="text-[8px] font-medium tracking-[4px] uppercase">Zen Protocol</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }
);

AnimatedTicket.displayName = "AnimatedTicket";

export { AnimatedTicket };
