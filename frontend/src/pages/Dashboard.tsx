import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { executionsApi, statsApi } from '../api/client';
import { Activity, FileCheck, AlertCircle, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard: React.FC = () => {
    const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => statsApi.get().then(r => r.data) });
    const { data: executions } = useQuery({ queryKey: ['executions'], queryFn: () => executionsApi.list().then(r => r.data) });

    const runMutation = useMutation({
        mutationFn: executionsApi.run,
        onSuccess: (data) => {
            alert(`Run started: ${data.data.execution_id}`);
        },
        onError: (err) => {
            alert('Failed to start run');
        }
    });

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-soft hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                    <Icon className="w-6 h-6 text-current" />
                </div>
                <span className="text-slate-400 text-sm">Real-time</span>
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value ?? '-'}</p>
                {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="text-center md:text-left py-4">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Welcome, Administrator</h1>
                <p className="text-slate-500 mt-2 text-lg">Here's what's happening with your monitored documents today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Monitored Documents"
                    value={stats?.documents_count}
                    icon={FileCheck}
                    color="bg-blue-500"
                    subtext="Total active documents"
                />
                <StatCard
                    title="Total Versions"
                    value={stats?.versions_count}
                    icon={AlertCircle}
                    color="bg-amber-500"
                    subtext="Captured snapshots"
                />
                <StatCard
                    title="Total Executions"
                    value={stats?.executions_count}
                    icon={Activity}
                    color="bg-emerald-500"
                    subtext={`Last status: ${executions?.[0]?.status ?? 'Unknown'}`}
                />
            </div>

            {/* Action / Context Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Recent Executions List */}
                <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-soft">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Executions</h3>
                    <div className="space-y-4">
                        {executions?.slice(0, 5).map((exec) => (
                            <div key={exec.id} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className={`w-2 h-2 mt-2 rounded-full ${exec.status === 'completed' ? 'bg-green-500' : exec.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 capitalize">{exec.status}</p>
                                    <p className="text-xs text-slate-400">
                                        {formatDistanceToNow(new Date(exec.start_time), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {!executions?.length && <p className="text-sm text-slate-400">No executions found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
