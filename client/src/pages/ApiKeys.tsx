import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Plus, Trash2, Key, Globe, AlertTriangle } from 'lucide-react';
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

interface AppData {
    id: string;
    name: string;
    api_key: string;
    is_active: boolean;
    created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

export default function ApiKeys() {
    const { token } = useAuth();
    const [apps, setApps] = useState<AppData[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAppName, setNewAppName] = useState('');
    const [generating, setGenerating] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

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
                        <h3 className="text-sm font-semibold text-white mb-2">Create Application</h3>
                        <p className="text-zinc-500 text-xs font-medium">Link a new store or platform to your ZenWallet account.</p>
                    </div>

                    <div className="dashboard-card p-6 bg-white/[0.01]">
                        <div className="flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
                            <div className="space-y-2 w-full flex-1">
                                <Label htmlFor="appName" className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest px-1">App Name</Label>
                                <Input
                                    id="appName"
                                    value={newAppName}
                                    onChange={(e) => setNewAppName(e.target.value)}
                                    placeholder="e.g. Acme Store"
                                    className="h-11 bg-white/[0.02] border-zinc-400/10 text-sm font-medium rounded-xl focus-visible:ring-1 focus-visible:ring-white/5"
                                />
                            </div>

                            <Button
                                onClick={createKey}
                                disabled={generating}
                                className="h-11 px-8 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-all active:scale-95 shadow-xl"
                            >
                                {generating ? "Creating..." : "Generate Key"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Compact List Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-white/[0.03] pb-4 px-1">
                        <h3 className="text-sm font-semibold text-white">Your Applications</h3>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{apps.length} Total</span>
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
                        <div className="bg-white/[0.01] border border-zinc-400/10 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.03] bg-white/[0.02]">
                                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Application</th>
                                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Secret Key</th>
                                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Created</th>
                                            <th className="py-4 px-6 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {apps.map((app) => (
                                            <tr key={app.id} className="group hover:bg-white/[0.01] transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-zinc-400/10 flex items-center justify-center text-xs font-bold text-white">
                                                            {app.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-white">{app.name}</div>
                                                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{app.id.slice(0, 8)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 max-w-[200px] lg:max-w-md">
                                                        <code className="text-[11px] text-zinc-500 font-mono truncate bg-white/[0.02] px-2 py-1 rounded-md border border-white/[0.03]">
                                                            {app.api_key}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(app.api_key)}
                                                            className="text-zinc-400 hover:text-white transition-colors p-1"
                                                            title="Copy Key"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-[11px] text-zinc-500 font-medium">
                                                        {new Date(app.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setKeyToDelete(app.id)}
                                                        className="h-8 px-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg font-bold text-[10px] uppercase tracking-wider"
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
                <DialogContent className="bg-[#0c0c0e] border-zinc-400/10 sm:max-w-[400px] rounded-[2rem] p-8 shadow-2xl">
                    <DialogHeader>
                        <div className="mx-auto h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                            <AlertTriangle className="text-red-500" size={24} />
                        </div>
                        <DialogTitle className="text-xl font-bold text-center text-white">Revoke Access?</DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-3 text-sm font-medium">
                            This will immediately disable the API key for <span className="text-white">"{apps.find(a => a.id === keyToDelete)?.name}"</span>.
                            This action is permanent.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setKeyToDelete(null)}
                            className="h-12 border-zinc-400/10 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-900/20"
                        >
                            Revoke Key
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Integration Guide Modal */}
            <IntegrationGuideModal />
        </AppLayout>
    );
}

function IntegrationGuideModal() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    // Constructing the AI prompt
    const aiPrompt = `You are an expert developer. Please integrate the ZenWallet Payment Gateway into my application.

Here are the API details:
Base URL: ${API_URL}

1. **Authentication**: 
   - Use the header \`x-api-key: [MY_API_KEY]\` for all requests.

2. **Create Payment Request**:
   - Endpoint: POST \`/external/create-request\`
   - Body:
     \`\`\`json
     {
       "amount": 500,
       "merchantId": "${user?.id || '[MY_MERCHANT_ID]'}",
       "referenceId": "ORDER_ID_123",
       "callbackUrl": "https://your-app.com/payment/callback"
     }
     \`\`\`
   - Response contains \`paymentUrl\` and \`token\`. Redirect the user to \`paymentUrl\`.

3. **Verify Payment**:
   - Endpoint: GET \`/external/verify-reference?merchantId=${user?.id || '...'}&referenceId=ORDER_ID_123\`
   - Use this to confirm payment status server-side.

Please write the code to handle this payment flow using best practices.`;

    const copyPrompt = () => {
        navigator.clipboard.writeText(aiPrompt);
        toast.success("Integration prompt copied!");
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setOpen(true)}
                    className="h-12 px-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 font-bold flex items-center gap-2"
                >
                    <Globe size={18} />
                    Integration Guide
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[#0c0c0e] border-zinc-800 sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl p-0">
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Key className="text-indigo-500" />
                            AI Integration Prompt
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 mt-2">
                            Copy this prompt and paste it into ChatGPT, Claude, or any AI assistant to instantly generate integration code for your app.
                        </DialogDescription>
                    </div>

                    <div className="flex-1 overflow-auto p-6 bg-zinc-950/50">
                        <div className="relative group">
                            <div className="absolute right-4 top-4 z-10">
                                <Button
                                    size="sm"
                                    onClick={copyPrompt}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
                                >
                                    <Copy size={14} className="mr-2" />
                                    Copy Prompt
                                </Button>
                            </div>
                            <pre className="font-mono text-sm text-zinc-400 bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 whitespace-pre-wrap leading-relaxed selection:bg-indigo-500/30">
                                {aiPrompt}
                            </pre>
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">
                            Close
                        </Button>
                        <Button onClick={copyPrompt} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                            Copy & Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
