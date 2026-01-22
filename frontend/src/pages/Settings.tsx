import React from 'react';
import { Shield, User, Server, Database } from 'lucide-react';

export const Settings: React.FC = () => {
    const role = localStorage.getItem('user_role') || 'admin';
    const embeddingProvider = "Google Generative AI"; // Static for UI, would key off env in real app

    const permissions = [
        { action: "View Dashboard & Documents", admin: true, manager: true, owner: true, viewer: true },
        { action: "View Execution History", admin: true, manager: true, owner: true, viewer: true },
        { action: "Create New Monitors", admin: true, manager: true, owner: true, viewer: false },
        { action: "Edit Schedules", admin: true, manager: true, owner: true, viewer: false },
        { action: "Trigger Manual Runs", admin: true, manager: true, owner: true, viewer: false },
        { action: "Delete Documents", admin: true, manager: false, owner: true, viewer: false },
        { action: "Manage Users & Roles", admin: true, manager: false, owner: true, viewer: false },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your account preferences and view system configuration.</p>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
                        JD
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">John Doe</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide border border-slate-200">
                                {role}
                            </span>
                            <span className="text-slate-400 text-sm">john.doe@example.com</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Capabilities */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Role Capabilities Matrix</h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Action</th>
                                    <th className="px-6 py-3 font-medium text-center">Admin</th>
                                    <th className="px-6 py-3 font-medium text-center">Owner</th>
                                    <th className="px-6 py-3 font-medium text-center">Manager</th>
                                    <th className="px-6 py-3 font-medium text-center">Viewer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {permissions.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700">{p.action}</td>
                                        <td className="px-6 py-3 text-center">
                                            {p.admin ? <span className="text-green-600">●</span> : <span className="text-slate-200">○</span>}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {p.owner ? <span className="text-green-600">●</span> : <span className="text-slate-200">○</span>}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {p.manager ? <span className="text-green-600">●</span> : <span className="text-slate-200">○</span>}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {p.viewer ? <span className="text-green-600">●</span> : <span className="text-slate-200">○</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Configuration */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                            <Server className="w-4 h-4 text-slate-500" />
                            <h3>System status</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Embedding Provider</div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    {embeddingProvider}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Database</div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Database className="w-3 h-3 text-slate-400" />
                                    PostgreSQL (Vector)
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Version</div>
                                <div className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit">
                                    v1.2.0-walmart-rc1
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
