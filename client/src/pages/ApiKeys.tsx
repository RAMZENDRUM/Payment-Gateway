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

                            <IntegrationGuideModal />
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


        </AppLayout>
    );
}

function IntegrationGuideModal() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

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
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
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
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
