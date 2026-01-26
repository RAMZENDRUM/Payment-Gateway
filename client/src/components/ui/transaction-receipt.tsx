import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Share2,
    AlertCircle,
    Split,
    X,
    ChevronDown,
    ShieldCheck,
    Copy,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

import { AnimatedTicket } from "@/components/ui/ticket-confirmation-card";

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

interface TransactionReceiptProps {
    transaction: TransactionData | null;
    isOpen: boolean;
    onClose: () => void;
}

const TransactionReceipt: React.FC<TransactionReceiptProps> = ({ transaction, isOpen, onClose }) => {
    if (!transaction) return null;

    const isDebit = transaction.type === 'TRANSFER' || (transaction.sender_name && transaction.sender_name !== 'ZenWallet Treasury' && transaction.sender_name !== 'ZenWallet System');
    const receiverTitle = isDebit ? transaction.receiver_name : transaction.sender_name;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Receipt Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-[300px] max-h-[90vh] flex flex-col items-center overflow-y-auto scrollbar-hide py-4"
                    >
                        {/* The Professional Ticket Card */}
                        <AnimatedTicket
                            ticketId={transaction.id.replace(/-/g, '').slice(0, 12).toUpperCase()}
                            amount={transaction.amount}
                            date={new Date(transaction.created_at)}
                            receiverTitle={receiverTitle || "Zen User"}
                            status={transaction.status}
                            className="shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                        />

                        {/* Minimal Actions */}
                        <div className="w-full mt-4 space-y-2">
                            <Button
                                onClick={onClose}
                                className="w-full h-11 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                            >
                                Done
                            </Button>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(transaction.id);
                                    toast.success("ID Copied");
                                }}
                                className="w-full py-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Copy Transaction ID
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


export default TransactionReceipt;
