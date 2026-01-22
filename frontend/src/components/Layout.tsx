import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Activity, Plus, File, Clock, Sparkles } from 'lucide-react';
import { NewMonitorModal } from './NewMonitorModal';

export const Layout: React.FC = () => {
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <Link
            to={to}
            className={`flex items-center px-4 py-3 mx-1 rounded-full text-sm font-medium transition-colors ${isActive(to)
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <Icon className={`w-5 h-5 mr-3 ${isActive(to) ? 'text-primary-500' : 'text-slate-400'}`} strokeWidth={2} />
            {label}
        </Link>
    );

    return (
        <div className="flex h-screen bg-white">
            <NewMonitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Sidebar - Walmart Style */}
            <div className="w-[260px] bg-white border-r flex flex-col h-full flex-shrink-0">

                {/* Brand Header */}
                <div className="h-16 flex items-center pl-5 border-b justify-start w-full">
                    <div className="flex items-center gap-3 font-bold text-primary-600 text-lg tracking-tight">
                        <Sparkles className="w-6 h-6 text-[#FFC220] fill-current" />
                        <span>Controls DocuDiff</span>
                    </div>
                </div>

                {/* New Chat / Action Button Area - Hidden for Viewers */}
                {localStorage.getItem('user_role') !== 'viewer' && (
                    <div className="p-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors shadow-sm font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Monitor</span>
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-2 mt-2">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/documents" icon={FileText} label="Documents" />
                    <NavItem to="/executions" icon={Activity} label="Executions" />
                </nav>

                {/* User / Settings Footer */}
                <div className="p-3 border-t bg-slate-50">
                    <div className="mb-2 px-1">
                        <select
                            className="w-full text-xs border-slate-200 rounded-md bg-white text-slate-600 focus:ring-primary-100 focus:border-primary-300"
                            value={localStorage.getItem('user_role') || 'admin'}
                            onChange={(e) => {
                                localStorage.setItem('user_role', e.target.value);
                                window.location.reload();
                            }}
                        >
                            <option value="admin">Role: Admin</option>
                            <option value="manager">Role: Manager</option>
                            <option value="owner">Role: Owner</option>
                            <option value="viewer">Role: Viewer</option>
                        </select>
                    </div>
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                    <div className="mt-2 flex items-center px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            JD
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">John Doe</p>
                            <p className="text-xs text-slate-500 capitalize">{localStorage.getItem('user_role') || 'admin'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <main className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
