import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Plus, Trash2, Key, Globe, AlertTriangle, Terminal, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppData {
    id: string;
    name: string;
    api_key: string;
    is_active: boolean;
    created_at: string;
}

import { API_URL } from '@/lib/api';

export default function ApiKeys() {
    const { token } = useAuth();
    const [apps, setApps] = useState<AppData[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAppName, setNewAppName] = useState('');
    const [generating, setGenerating] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
    const [viewingTransactions, setViewingTransactions] = useState<string | null>(null);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            const res = await axios.get(`${API_URL}/apps`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApps(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    const createKey = async () => {
        if (!newAppName.trim()) {
            toast.error('Enter an app name');
            return;
        }
        setGenerating(true);
        try {
            await axios.post(`${API_URL}/apps`,
                { name: newAppName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('New API Key Generated');
            setNewAppName('');
            fetchApps();
        } catch (err) {
            toast.error('Failed to generate key');
        } finally {
            setGenerating(false);
        }
    };

    const deleteKey = (id: string) => {
        setKeyToDelete(id);
    };

    const confirmDelete = async () => {
        if (!keyToDelete) return;
        try {
            await axios.delete(`${API_URL}/apps/${keyToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('App deleted');
            fetchApps();
        } catch (err) {
            toast.error('Failed to delete');
        } finally {
            setKeyToDelete(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <AppLayout title="Developer API" subtitle="Manage your API keys and integrate ZenWallet into your applications.">
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">

                {/* Streamlined Generate Section */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">Connect Application</h3>
                        <p className="text-muted-foreground text-sm font-medium">Link a new store or platform to your node instance.</p>
                    </div>

                    <div className="dashboard-card p-8 bg-card/10 backdrop-blur-sm border-border/40">
                        <div className="flex flex-col sm:flex-row gap-5 items-end max-w-2xl">
                            <div className="space-y-2.5 w-full flex-1">
                                <Label htmlFor="appName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Application Identifier</Label>
                                <Input
                                    id="appName"
                                    value={newAppName}
                                    onChange={(e) => setNewAppName(e.target.value)}
                                    placeholder="e.g. Acme Global Store"
                                    className="h-12 bg-muted/40 border-border text-base font-bold rounded-2xl focus-visible:ring-violet-500/20 shadow-sm"
                                />
                            </div>

                            <Button
                                onClick={createKey}
                                disabled={generating}
                                className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-xl shadow-foreground/5"
                            >
                                {generating ? "Generating..." : "Generate Key"}
                            </Button>

                            <IntegrationGuideModal />
                        </div>
                    </div>
                </div>

                {/* Compact List Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-5 px-1">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Active Up-links</h3>
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider bg-muted px-3 py-1 rounded-md">{apps.length} Total</span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/[0.01] animate-pulse rounded-xl border border-zinc-400/10" />
                            ))}
                        </div>
                    ) : apps.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-zinc-400/10 rounded-2xl bg-white/[0.01]">
                            <Globe className="text-zinc-800 mx-auto mb-4" size={24} />
                            <p className="text-zinc-500 text-xs font-medium">No applications connected yet.</p>
                        </div>
                    ) : (
                        <div className="bg-card/5 border border-border/40 rounded-[2rem] overflow-hidden shadow-sm backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border/40 bg-muted/40 transition-colors">
                                            <th className="py-5 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Application</th>
                                            <th className="py-5 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secret Key</th>
                                            <th className="py-5 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settled Since</th>
                                            <th className="py-5 px-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Command</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {apps.map((app) => (
                                            <tr key={app.id} className="group hover:bg-muted/10 transition-colors">
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-muted border border-border/10 flex items-center justify-center text-xs font-bold text-foreground shadow-sm">
                                                            {app.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-foreground group-hover:text-violet-500 transition-colors">{app.name}</div>
                                                            <div className="text-[9px] text-muted-foreground font-mono mt-1 opacity-60 tracking-wider uppercase">{app.id.slice(0, 12)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center gap-3 max-w-[200px] lg:max-w-md">
                                                        <code className="text-[11px] text-muted-foreground font-mono truncate bg-muted/20 px-3 py-1.5 rounded-xl border border-border/20 shadow-inner">
                                                            {app.api_key}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(app.api_key)}
                                                            className="text-muted-foreground hover:text-violet-500 transition-colors p-2 rounded-lg hover:bg-muted"
                                                            title="Copy Key"
                                                        >
                                                            <Copy size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="text-[11px] text-muted-foreground font-bold italic">
                                                        {new Date(app.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setViewingTransactions(app.id)}
                                                        className="h-8 px-3 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg font-semibold text-xs uppercase"
                                                    >
                                                        <Sparkles size={13} className="mr-1" /> History
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setKeyToDelete(app.id)}
                                                        className="h-8 px-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg font-semibold text-xs uppercase"
                                                    >
                                                        <Trash2 size={13} className="mr-1" /> Revoke
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
                <DialogContent className="bg-card border-border sm:max-w-[420px] rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl">
                    <DialogHeader>
                        <div className="mx-auto h-16 w-16 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
                            <AlertTriangle className="text-red-500" size={28} />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center text-foreground tracking-tight">Revoke Protocol?</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground pt-4 text-sm font-medium leading-relaxed">
                            This will immediately de-authorize <span className="text-foreground font-semibold">"{apps.find(a => a.id === keyToDelete)?.name}"</span>.
                            Active transmissions will fail permanently.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-10 grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setKeyToDelete(null)}
                            className="h-14 border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-2xl font-bold text-xs uppercase tracking-wide transition-all"
                        >
                            Abort
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="h-14 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                        >
                            Revoke Key
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Transaction History Dialog */}
            <TransactionHistoryModal
                appId={viewingTransactions}
                appName={apps.find(a => a.id === viewingTransactions)?.name || ''}
                open={!!viewingTransactions}
                onOpenChange={(open) => !open && setViewingTransactions(null)}
                token={token}
            />

        </AppLayout>
    );
}

function IntegrationGuideModal() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    // ... (rest of IntegrationGuideModal)
    // Constructing the AI prompt
    const aiPrompt = `## Role
Act as a Senior Backend Integration Engineer.

## Task
Integrate the ZenWallet Payment Gateway into my application.

## API Configuration
- **Base URL**: ${API_URL}
- **Auth Header**: \`x-api-key: [YOUR_API_KEY]\` (Replace with my actual key)

## Required Workflows

### 1. Initiate Payment
Create a checkout session when the user clicks "Pay".
- **Endpoint**: \`POST /external/create-request\`
- **Payload**:
  \`\`\`json
  {
    "amount": 1500, // Amount in cents or smallest unit
    "merchantId": "${user?.id || 'YOUR_MARCHANT_ID'}",
    "referenceId": "ORDER_12345", // My unique order ID
    "callbackUrl": "https://myapp.com/callback"
  }
  \`\`\`
- **Action**: Redirect user to the returned \`paymentUrl\`.

### 2. Verify Transaction
Confirm the payment status when the user returns.
- **Endpoint**: \`GET /external/verify-reference\`
- **Params**: \`merchantId\` and \`referenceId\`

## Deliverable
Write clean, robust code to handle this flow. specific to my tech stack.`;

    const copyPrompt = () => {
        navigator.clipboard.writeText(aiPrompt);
        toast.success("Prompt copied to clipboard!");
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="h-11 px-6 rounded-xl border-2 border-dashed border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all font-bold text-xs flex items-center gap-2"
            >
                <Terminal size={14} />
                Integration Guide
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[#09090b] border border-zinc-800 sm:max-w-2xl overflow-hidden flex flex-col rounded-3xl shadow-2xl p-0 gap-0">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                                    <Sparkles size={16} fill="currentColor" className="opacity-50" />
                                </div>
                                AI Integration Assistant
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500 mt-1 text-xs font-medium pl-11">
                                Generates perfect integration code for any language.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Code Editor Area */}
                    <div className="relative group bg-[#0c0c0e]">
                        {/* Editor Controls */}
                        <div className="absolute right-4 top-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                onClick={copyPrompt}
                                className="h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-wider border border-zinc-700"
                            >
                                <Copy size={12} className="mr-2" />
                                Copy
                            </Button>
                        </div>

                        <ScrollArea maxHeight="50vh" className="p-6 bg-[#0c0c0e]">
                            <pre className="font-mono text-xs md:text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                {aiPrompt.split('\n').map((line, i) => (
                                    <div key={i} className="table-row">
                                        <span className="table-cell text-right pr-6 select-none text-zinc-800 text-[10px] w-8">{i + 1}</span>
                                        <span className="table-cell">{line}</span>
                                    </div>
                                ))}
                            </pre>
                        </ScrollArea>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/40">
                        <Button
                            onClick={() => { copyPrompt(); setOpen(false); }}
                            className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Copy size={16} />
                            Copy Prompt & Close
                        </Button>
                        <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium">
                            Paste this into ChatGPT, Claude, or Cursor to get started.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Transaction History Modal Component
function TransactionHistoryModal({ appId, appName, open, onOpenChange, token }: { appId: string | null, appName: string, open: boolean, onOpenChange: (open: boolean) => void, token: string | null }) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && appId) {
            fetchTransactions();
        }
    }, [open, appId]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/apps/${appId}/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(res.data);
        } catch (err) {
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-4xl rounded-[2rem] p-0 overflow-hidden shadow-2xl backdrop-blur-xl h-[80vh] flex flex-col">
                <DialogHeader className="p-8 pb-4 border-b border-border/40 bg-muted/20">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                            <Sparkles size={18} fill="currentColor" className="opacity-50" />
                        </div>
                        {appName} <span className="text-muted-foreground font-medium opacity-50 text-sm ml-2">Transaction History</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-card/50 p-0">
                    {loading ? (
                        <div className="space-y-4 p-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="text-muted-foreground/50" />
                            </div>
                            <p className="font-bold">No transactions found</p>
                            <p className="text-xs opacity-60 mt-1">This app hasn't processed any payments yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reference</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payer</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Amount</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="py-4 px-6 text-xs font-medium text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-xs font-mono text-foreground font-bold">
                                            {tx.reference_id || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-muted-foreground">
                                            {tx.sender_name || 'External / Anonymous'}
                                            <div className="text-[10px] opacity-50">{tx.sender_upi_id}</div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-black text-foreground">
                                            ₹{parseFloat(tx.amount).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
