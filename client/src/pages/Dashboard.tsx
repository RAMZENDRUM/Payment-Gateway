import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStats } from '@/hooks/useWalletStats';
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
    value: number | string;
    unit?: string;
    icon: React.ReactNode;
    description?: string;
}

const MetricCard = ({ title, value, unit = '', icon, description }: MetricCardProps) => (
    <div className="p-6 dashboard-card group">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/5 text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                {icon}
            </div>
            <span className="text-[13px] font-medium text-zinc-500">{title}</span>
        </div>
        <div>
            <div className="text-3xl font-semibold text-white tabular-nums tracking-tight">
                <span className="text-xl font-normal text-zinc-600 mr-1.5">{unit}</span>
                {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
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

const RealtimeChart = React.memo(({ data, title, dataKey, lineColor }: RealtimeChartProps) => {
    const chartData = useMemo(() => data || [], [data]);
    return (
        <div className="border-pane flex-1">
            <div className="px-6 pt-6 pb-2">
                <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
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
                            <Line type="monotone" dataKey={dataKey} stroke={lineColor} strokeWidth={2} dot={false} animationDuration={1000} />
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
    const { totalRevenue, salesCount, averageSale, salesChartData, latestPayments } = useWalletStats();

    return (
        <AppLayout title="Overview" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}`}>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Account Balance" value={totalRevenue || 0} unit="₹" icon={<DollarSign size={16} />} description="Available in ZenWallet" />
                    <MetricCard title="Total Transactions" value={salesCount || 0} icon={<Repeat2 size={16} />} description="Lifetime usage" />
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
                    <RealtimeChart data={salesChartData} title="Activity Velocity" dataKey="sales" lineColor="#3b82f6" />
                    <RealtimeChart data={salesChartData} title="Volume Matrix" dataKey="sales" lineColor="#6366f1" />
                </div>

                {/* Table */}
                <div className="pt-8">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h3 className="text-sm font-medium text-white">Recent Transactions</h3>
                        <Button variant="link" className="text-xs text-blue-500 font-medium h-auto p-0" onClick={() => navigate('/transactions')}>View All History</Button>
                    </div>

                    <div className="dashboard-card overflow-hidden">
                        <div className="divide-y divide-zinc-400/[0.08]">
                            {!latestPayments || latestPayments.length === 0 ? (
                                <div className="py-20 text-center text-zinc-600 font-medium text-sm">No transmissions detected</div>
                            ) : (
                                latestPayments.map((p) => (
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
                                ))
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
