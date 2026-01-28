import React from 'react';

const Loader = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
            <div className="relative max-w-fit text-[60px] italic font-bold text-white transition-colors duration-1000 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]">
                <span className="animate-cut transition-all duration-1000 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] tracking-tighter">
                    ZenWallet
                </span>
                <div className="absolute w-full h-[6px] rounded bg-[#FF828291] top-0 left-0 z-0 blur-[12px] animate-scan transition-all duration-1000 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"></div>
                <div className="absolute w-full h-[5px] rounded bg-[#FF8282] top-0 left-0 z-[1] opacity-90 animate-scan transition-all duration-1000 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"></div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] opacity-50">
                    Hardware Interface Active
                </span>
            </div>
        </div>
    );
};

export default Loader;
