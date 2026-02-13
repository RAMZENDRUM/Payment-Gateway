import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BankingReceipt, TransactionData } from "./banking-receipt";



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
                        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                    />

                    {/* Receipt Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl flex flex-col items-center overflow-hidden rounded-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
                    >
                        <BankingReceipt
                            transaction={transaction}
                            onClose={onClose}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


export default TransactionReceipt;
