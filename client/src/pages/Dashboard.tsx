import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStats } from '@/hooks/useWalletStats';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, Repeat2, TrendingUp, Activity, BarChart, Clock, Settings, LogOut, QrCode, Send as SendIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + ' Coins';
};

interface MetricCardProps {
    title: string;
    value: number | string;
    unit?: string;
    icon: React.ReactNode;
    description?: string;
    valueClassName?: string;
}

const MetricCard = ({ title, value, unit = '', icon, description, valueClassName }: MetricCardProps) => (
    <Card className="flex-1 min-w-[200px] bg-zinc-950 border-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-zinc-200">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold text-white tabular-nums ${valueClassName}`}>
                {unit}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            {description && <p className="text-xs text-zinc-600 mt-1">{description}</p>}
        </CardContent>
    </Card>
);

interface RealtimeChartProps {
    data: any[];
    title: string;
    dataKey: string;
    lineColor: string;
    tooltipFormatter?: any;
    legendName: string;
}

const RealtimeChart = React.memo(({ data, title, dataKey, lineColor, tooltipFormatter, legendName }: RealtimeChartProps) => {
    const chartData = useMemo(() => {
        return data || [];
    }, [data]);

    const colors = {
        grid: '#18181b',
        axis: '#52525b',
        tooltipBg: '#000000',
        tooltipBorder: '#27272a',
        tooltipText: '#fafafa',
        legend: '#71717a',
        cursor: '#6366f1'
    };

    return (
        <Card className="flex-1 min-w-[300px] w-full lg:max-w-[calc(50%-16px)] bg-zinc-950 border-zinc-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart className="h-5 w-5 text-indigo-500" />{title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.3} />
                            <XAxis
                                dataKey="time"
                                stroke={colors.axis}
                                fontSize={10}
                                tickFormatter={(tick) => tick}
                            />
                            <YAxis stroke={colors.axis} fontSize={10} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: colors.tooltipBg,
                                    borderColor: colors.tooltipBorder,
                                    borderRadius: '0.75rem',
                                    color: '#fff'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={lineColor}
                                strokeWidth={2}
                                dot={false}
                                name={legendName}
                                animationDuration={800}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});

export default function Dashboard() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const {
        totalRevenue,
        cumulativeRevenueData,
        salesCount,
        averageSale,
        salesChartData,
        latestPayments,
        loading
    } = useWalletStats();

    return (
        <AppLayout>
            <div className="min-h-screen w-full bg-transparent text-slate-50 p-4 md:p-8 flex flex-col gap-4 md:gap-8 overflow-x-hidden">
                <header className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">
                            Active Sales Tracker
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Real-time insights into your sales performance.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="text-zinc-500 hover:text-white transition-colors">
                            <Settings size={22} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => navigate('/payment')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                        >
                            <Plus size={16} strokeWidth={3} /> Top-up
                        </button>
                        <button onClick={logout} className="text-zinc-500 hover:text-white transition-colors">
                            <LogOut size={22} strokeWidth={1.5} />
                        </button>
                    </div>
                </header>

                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Revenue"
                        value={totalRevenue || 0}
                        unit="C "
                        icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                        description="Total balance currently in wallet"
                        valueClassName="text-emerald-400"
                    />
                    <MetricCard
                        title="Total Transactions"
                        value={salesCount || 0}
                        icon={<Repeat2 className="h-4 w-4 text-indigo-400" />}
                        description="Number of successful payments"
                    />
                    <MetricCard
                        title="Average Sale"
                        value={averageSale || 0}
                        unit="C "
                        icon={<TrendingUp className="h-4 w-4 text-cyan-400" />}
                        description="Average coins per transaction"
                        valueClassName="text-cyan-400"
                    />
                    <Card className="flex-1 min-w-[200px] bg-zinc-950 border-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Activity Status</CardTitle>
                            <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Live
                            </div>
                            <p className="text-xs text-zinc-600 mt-1">Data streaming in real-time</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="flex flex-wrap gap-4 justify-center">
                    <RealtimeChart
                        data={salesChartData}
                        title="Sales per Second"
                        dataKey="sales"
                        lineColor="#6366f1"
                        legendName="Sales Amount"
                    />
                    <RealtimeChart
                        data={cumulativeRevenueData}
                        title="Cumulative Revenue Trend"
                        dataKey="sales"
                        lineColor="#06b6d4"
                        legendName="Cumulative Revenue"
                    />
                </div>

                {/* Latest Payments Section */}
                <Card className="w-full h-fit overflow-hidden bg-zinc-950 border-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <DollarSign className="h-5 w-5 text-indigo-500" /> Latest Payments
                        </CardTitle>
                        <CardDescription>Recently completed transactions, updated live.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[300px] overflow-y-auto">
                            <div className="divide-y divide-zinc-900">
                                {latestPayments.length === 0 ? (
                                    <p className="p-10 text-center text-zinc-600 uppercase font-black text-sm tracking-widest">No payments yet...</p>
                                ) : (
                                    latestPayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-6 hover:bg-zinc-900 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xl text-white">{payment.amount.toLocaleString()} Coins</span>
                                                <span className="text-sm text-zinc-400 font-medium">
                                                    {payment.product} <span className="text-zinc-700 mx-1">•</span> <span className="text-indigo-400">{payment.customer}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-zinc-600 font-mono">{payment.time}</span>
                                                <span className="text-[10px] text-zinc-800 mt-1 uppercase font-bold tracking-tighter">{payment.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-4 text-xs text-zinc-700 font-bold uppercase tracking-widest bg-zinc-950">
                        <p>Displaying the 10 most recent transactions.</p>
                    </CardFooter>
                </Card>

                {/* Quick Action FAB for Wallet Operations */}
                <div className="fixed bottom-8 right-8 flex flex-col gap-4 group">
                    <QuickFAB to="/send" icon={<SendIcon size={20} />} label="Send" color="bg-indigo-600 shadow-indigo-600/20" />
                    <QuickFAB to="/receive" icon={<QrCode size={20} />} label="Receive" color="bg-indigo-700 shadow-indigo-700/20" />
                    <QuickFAB to="/scan" icon={<QrCode size={20} />} label="Scan" color="bg-indigo-800 shadow-indigo-800/20" />
                </div>
            </div>
        </AppLayout>
    );
}

interface QuickFABProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    color: string;
}

const QuickFAB = ({ to, icon, label, color }: QuickFABProps) => {
    const navigate = useNavigate();
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(to)}
            className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-xl relative group`}
        >
            {icon}
            <span className="absolute right-full mr-4 px-2 py-1 bg-zinc-950 border border-zinc-900 text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                {label}
            </span>
        </motion.button>
    );
};
