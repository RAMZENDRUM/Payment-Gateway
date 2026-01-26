import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Plus, Trash2, Key, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

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

    const deleteKey = async (id: string) => {
        if (!confirm('Are you sure? This will break any integration using this key.')) return;
        try {
            await axios.delete(`${API_URL}/apps/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('App deleted');
            fetchApps();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <AppLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Developer API</h1>
                    <p className="text-zinc-500">Manage your API keys and integrate ZenWallet into your applications.</p>
                </div>

                {/* Create New Key Section */}
                <Card className="bg-zinc-950 border-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Plus className="text-indigo-500" size={20} /> Generate New Key
                        </CardTitle>
                        <CardDescription>Create a unique API key for each application you connect.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Input
                                value={newAppName}
                                onChange={(e) => setNewAppName(e.target.value)}
                                placeholder="App Name (e.g. My Shopify Store)"
                                className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-600 max-w-md"
                            />
                            <Button
                                onClick={createKey}
                                disabled={generating}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                            >
                                {generating ? 'Generating...' : 'Create API Key'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Existing Keys List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Your Apps</h2>
                    {loading ? (
                        <p className="text-zinc-500">Loading...</p>
                    ) : apps.length === 0 ? (
                        <p className="text-zinc-600 italic">No API keys created yet.</p>
                    ) : (
                        <div className="grid gap-4">
                            {apps.map((app) => (
                                <Card key={app.id} className="bg-zinc-900/50 border-zinc-800">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                    <Globe className="text-indigo-400" size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{app.name}</h3>
                                                    <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">Unique ID: {app.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>

                                            <div className="bg-black border border-zinc-800 rounded-lg p-3 flex items-center justify-between max-w-2xl group relative overflow-hidden">
                                                <code className="text-zinc-300 font-mono text-sm tracking-wide break-all">
                                                    {app.api_key}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(app.api_key)}
                                                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                                                    title="Copy Key"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                {/* Security Blur Overlay - easy to copy but looks secure */}
                                                {/* <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold text-white uppercase tracking-widest"
                                                     onClick={() => copyToClipboard(app.api_key)}>
                                                    Click to Copy
                                                </div> */}
                                            </div>
                                            <p className="text-xs text-zinc-600">
                                                Created on {new Date(app.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteKey(app.id)}
                                            className="text-zinc-600 hover:text-red-400 hover:bg-red-950/30"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
