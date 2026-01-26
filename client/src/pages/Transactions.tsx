import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Filter, Download } from 'lucide-react';

export default function Transactions() {
    return (
        <AppLayout>
            <div className="h-full w-full overflow-y-auto">
                {/* Page Header */}
                <div className="px-8 py-5 bg-[#0f0f10] border-b border-slate-800/30">
                    <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight">Transactions</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Complete transaction history</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2">
                                <Filter size={14} />
                                Filter
                            </button>
                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2">
                                <Download size={14} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-8 py-6 max-w-[1600px] mx-auto">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#13131a] border border-slate-800/30 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-[#13131a] rounded-md border border-slate-800/30 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-800/30">
                            <h3 className="text-sm font-semibold text-white">All Transactions</h3>
                        </div>
                        <div className="p-20 text-center text-slate-600">
                            <p className="text-sm">Transaction history will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
