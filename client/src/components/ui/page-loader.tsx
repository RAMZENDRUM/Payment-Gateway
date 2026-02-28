import React from 'react';
import { motion } from 'framer-motion';

export default function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
            <div className="relative">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full scale-150 animate-pulse" />

                {/* Circular Spinner */}
                <div className="w-12 h-12 border-[3px] border-violet-600/10 border-t-violet-600 rounded-full animate-spin relative z-10" />
            </div>

            <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic"
            >
                Fetching Encrypted Data...
            </motion.p>
        </div>
    );
}
