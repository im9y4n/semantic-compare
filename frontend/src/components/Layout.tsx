import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Activity, Plus, File, Clock } from 'lucide-react';
import { NewMonitorModal } from './NewMonitorModal';

export const Layout: React.FC = () => {
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <Link
            to={to}
            className={`flex items-center px-3 py-3 mx-2 rounded-lg text-sm font-medium transition-colors ${isActive(to)
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
        >
            <Icon className="w-5 h-5 mr-3" strokeWidth={2} />
            {label}
        </Link>
    );

    return (
        <div className="flex h-screen bg-white">
            <NewMonitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Sidebar - ChatGPT Style */}
            <div className="w-[260px] bg-slate-50 border-r flex flex-col h-full flex-shrink-0">

                {/* New Chat / Action Button Area */}
                <div className="p-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-lg hover:bg-white transition-colors shadow-sm bg-white text-slate-700 mb-4"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Monitor</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-1">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Platform
                    </div>
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/documents" icon={FileText} label="Documents" />
                    <NavItem to="/executions" icon={Activity} label="Executions" />

                    <div className="mt-8 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        History
                    </div>
                    <div className="px-2 space-y-1">
                        {/* Mock history items */}
                        <button className="w-full text-left flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg truncate">
                            <Clock className="w-4 h-4 mr-3 opacity-50" />
                            Medical Policy Update
                        </button>
                        <button className="w-full text-left flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg truncate">
                            <Clock className="w-4 h-4 mr-3 opacity-50" />
                            Privacy Notice Q1
                        </button>
                    </div>
                </nav>

                {/* User / Settings Footer */}
                <div className="p-3 border-t bg-slate-50">
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                    <div className="mt-2 flex items-center px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            JD
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">John Doe</p>
                            <p className="text-xs text-slate-500">Admin</p>
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
