import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStats } from '@/hooks/useWalletStats';
import { useSpring, useTransform, animate } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    DollarSign,
    Repeat2,
    TrendingUp,
    Activity,
    Clock,
    Send as SendIcon,
    Plus,
    QrCode,
    Shield,
    Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { FlippableCreditCard } from '@/components/ui/credit-debit-card';

interface MetricCardProps {
    title: string;
    value: number;
    unit?: string;
    icon: React.ReactNode;
    description?: string;
    decimals?: number;
}

const RollingDigit = ({ digit, index }: { digit: string; index: number }) => {
    const isNumber = !isNaN(parseInt(digit));
    if (!isNumber) return <span className="w-[0.3em] inline-flex justify-center">{digit}</span>;

    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <span className="inline-flex h-[1.1em] w-[0.6em] overflow-hidden leading-none relative">
            <motion.span
                initial={{ y: "-30%" }}
                animate={{ y: `-${parseInt(digit) * 10}%` }}
                transition={{
                    type: "spring",
                    stiffness: 60,
                    damping: 12,
                    mass: 0.5,
                    delay: index * 0.01
                }}
                className="flex flex-col absolute top-0 left-0 w-full"
            >
                {digits.map((d) => (
                    <span key={d} className="h-[1.1em] flex items-center justify-center">
                        {d}
                    </span>
                ))}
            </motion.span>
            <span className="opacity-0 invisible">8</span>
        </span>
    );
};

const AnimatedNumber = ({ value, decimals = 2 }: { value: number; decimals?: number }) => {
    const stringValue = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span className="inline-flex items-baseline overflow-hidden">
            {stringValue.split("").map((char, i) => (
                <RollingDigit key={`${stringValue.length - i}-${char}`} digit={char} index={i} />
            ))}
        </span>
    );
};

const MetricCard = ({ title, value, unit = '', icon, description, decimals = 2 }: MetricCardProps) => (
    <div className="p-6 dashboard-card group">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/5 text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                {icon}
            </div>
            <span className="text-[13px] font-medium text-zinc-500">{title}</span>
        </div>
        <div>
            <div className="text-3xl font-semibold text-white tabular-nums tracking-tight flex items-baseline">
                <span className="text-xl font-normal text-zinc-600 mr-1.5">{unit}</span>
                <AnimatedNumber value={value} decimals={decimals} />
            </div>
            {description && <p className="text-[11px] text-zinc-500 mt-3 font-medium">{description}</p>}
        </div>
    </div>
);

interface RealtimeChartProps {
    data: any[];
    title: string;
    dataKey: string;
    lineColor: string;
}

const MoneyFlowChart = React.memo(({ data }: { data: any[] }) => {
    const chartData = useMemo(() => data || [], [data]);
    return (
        <div className="border-pane flex-1">
            <div className="px-6 pt-6 pb-2">
                <h3 className="text-sm font-medium text-zinc-400">Money Flow (In vs Out)</h3>
            </div>
            <div className="p-6">
                <div style={{ width: '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.2} vertical={false} />
                            <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dx={-4} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    color: '#fff'
                                }}
                            />
                            <Line type="monotone" dataKey="moneyIn" stroke="#10b981" strokeWidth={2} dot={false} name="Incoming ₹" />
                            <Line type="monotone" dataKey="moneyOut" stroke="#ef4444" strokeWidth={2} dot={false} name="Outgoing ₹" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

const TransactionQualityChart = React.memo(({ data }: { data: any[] }) => {
    const chartData = useMemo(() => data || [], [data]);
    return (
        <div className="border-pane flex-1">
            <div className="px-6 pt-6 pb-2">
                <h3 className="text-sm font-medium text-zinc-400">Avg Transaction Value</h3>
            </div>
            <div className="p-6">
                <div style={{ width: '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.2} vertical={false} />
                            <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dx={-4} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    color: '#fff'
                                }}
                            />
                            <Line type="step" dataKey="avgValue" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Avg Value ₹" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { totalRevenue, salesCount, averageSale, moneyFlowData, transactionQualityData, latestPayments } = useWalletStats();

    return (
        <AppLayout title="Overview" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}`}>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Account Balance" value={totalRevenue || 0} unit="₹" icon={<DollarSign size={16} />} description="Available in ZenWallet" />
                    <MetricCard title="Total Transactions" value={salesCount || 0} decimals={0} icon={<Repeat2 size={16} />} description="Lifetime usage" />
                    <MetricCard title="Average Spent" value={averageSale || 0} unit="₹" icon={<TrendingUp size={16} />} description="Per transaction avg" />
                    <div className="p-6 dashboard-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-500/5">
                                <Activity size={16} className="text-emerald-500" />
                            </div>
                            <span className="text-[13px] font-medium text-zinc-500">Bank Connectivity</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-3xl font-semibold text-white tracking-tight">
                            Active
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-3 font-medium">Linked and verified</p>
                    </div>
                </div>

                {/* Profile Link Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 dashboard-card relative group cursor-pointer" onClick={() => navigate('/profile')}>
                        <h3 className="text-white text-base font-medium flex items-center gap-2.5 mb-2">
                            <Shield className="text-indigo-400" size={18} />
                            Security Identity
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium">Configure network endpoints and biometric locking protocols for your local node instance.</p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-blue-500 font-medium">
                            Manage Security Settings <Plus size={12} />
                        </div>
                    </div>

                    <div className="p-8 dashboard-card relative group cursor-pointer" onClick={() => navigate('/wallet')}>
                        <h3 className="text-white text-base font-medium flex items-center gap-2.5 mb-2">
                            <Wallet className="text-blue-500" size={18} />
                            Node Settlement
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium">Real-time ledger access with instant liquidity injection and withdrawal capabilities.</p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-blue-500 font-medium">
                            Injection Balance <Plus size={12} />
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MoneyFlowChart data={moneyFlowData} />
                    <TransactionQualityChart data={transactionQualityData} />
                </div>

                {/* Table */}
                <div className="pt-8">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h3 className="text-sm font-medium text-white">Recent Transactions</h3>
                    </div>

                    <div className="dashboard-card overflow-hidden">
                        <div className="divide-y divide-zinc-400/[0.08]">
                            {!latestPayments || latestPayments.length === 0 ? (
                                <div className="py-20 text-center text-zinc-600 font-medium text-sm">No transmissions detected</div>
                            ) : (
                                <>
                                    {latestPayments.slice(0, 8).map((p) => (
                                        <div key={p.id} className="group flex items-center justify-between py-5 hover:bg-white/[0.02] px-6 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-zinc-900 border border-zinc-400/[0.08] rounded-full flex items-center justify-center text-zinc-400 font-medium text-xs">
                                                    {p.product.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{p.product}</p>
                                                    <p className="text-[10px] text-zinc-500 font-mono mt-1 tracking-tight">{p.id.slice(0, 16).toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-white tabular-nums">₹{p.amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-zinc-500 mt-1 font-medium">{p.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {latestPayments.length > 5 && (
                                        <button
                                            onClick={() => navigate('/transactions')}
                                            className="w-full py-4 text-xs font-medium text-zinc-500 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center justify-center border-t border-zinc-400/[0.08]"
                                        >
                                            See more
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Float Actions */}
            <div className="fixed bottom-10 right-10 flex flex-col gap-4">
                <button onClick={() => navigate('/send')} className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 transition-all"><SendIcon size={20} /></button>
                <button onClick={() => navigate('/receive')} className="h-12 w-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center border border-slate-700 hover:scale-105 transition-all"><QrCode size={20} /></button>
            </div>
        </AppLayout>
    );
}
