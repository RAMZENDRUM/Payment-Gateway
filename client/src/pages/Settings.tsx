import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bell, Shield, User, Palette } from 'lucide-react';

export default function Settings() {
    return (
        <AppLayout>
            <div className="h-full w-full overflow-y-auto">
                {/* Page Header */}
                <div className="px-8 py-5 bg-[#0f0f10] border-b border-slate-800/30">
                    <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Manage your account preferences</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-8 py-6 max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Account Settings */}
                        <div className="bg-[#13131a] rounded-md border border-slate-800/30 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800/30 flex items-center gap-2">
                                <User size={16} className="text-cyan-400" />
                                <h3 className="text-sm font-semibold text-white">Account</h3>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-slate-500">Account settings will appear here</p>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="bg-[#13131a] rounded-md border border-slate-800/30 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800/30 flex items-center gap-2">
                                <Shield size={16} className="text-cyan-400" />
                                <h3 className="text-sm font-semibold text-white">Security</h3>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-slate-500">Security settings will appear here</p>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-[#13131a] rounded-md border border-slate-800/30 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800/30 flex items-center gap-2">
                                <Bell size={16} className="text-cyan-400" />
                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-slate-500">Notification preferences will appear here</p>
                            </div>
                        </div>

                        {/* Appearance */}
                        <div className="bg-[#13131a] rounded-md border border-slate-800/30 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800/30 flex items-center gap-2">
                                <Palette size={16} className="text-cyan-400" />
                                <h3 className="text-sm font-semibold text-white">Appearance</h3>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-slate-500">Appearance settings will appear here</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
