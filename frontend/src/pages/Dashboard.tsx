import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { executionsApi, statsApi } from '../api/client';
import { Activity, FileCheck, AlertCircle, Play, CheckCircle, AlertTriangle, Clock, ArrowRight, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard: React.FC = () => {
    const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => statsApi.get().then(r => r.data) });
    const { data: executions } = useQuery({ queryKey: ['executions'], queryFn: () => executionsApi.list().then(r => r.data) });

    const [runSuccessId, setRunSuccessId] = React.useState<string | null>(null);

    const runMutation = useMutation({
        mutationFn: executionsApi.run,
        onSuccess: (data) => {
            setRunSuccessId(data.data.execution_id);
        },
        onError: (err) => {
            alert('Failed to start run'); // Keeping alert for error for now, potentially replace with proper toast later
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
                    title="Recent Updates (24h)"
                    value={stats?.recent_updates_count}
                    icon={Activity}
                    color="bg-amber-500"
                    subtext="Executions in last 24h"
                />
                <StatCard
                    title="Total Executions"
                    value={stats?.executions_count}
                    icon={Play}
                    color="bg-emerald-500"
                    subtext={`Last status: ${executions?.[0]?.status ?? 'Unknown'}`}
                />
            </div>

            {/* Action / Context Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Recent Executions List */}
                <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-soft">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Recent Executions</h3>
                        <Link to="/executions" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {executions?.slice(0, 5).map((exec) => (
                            <Link
                                key={exec.id}
                                to={`/executions/${exec.id}`}
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${exec.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                        exec.status === 'failed' ? 'bg-red-100 text-red-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                        {exec.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                            exec.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> :
                                                <Activity className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700 capitalize group-hover:text-blue-600 transition-colors">
                                                {exec.status}
                                            </span>
                                            <span className="text-xs font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                                {exec.id.substring(0, 8)}
                                            </span>
                                        </div>

                                        {/* Targets Display */}
                                        {exec.targets && exec.targets.length > 0 ? (
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {exec.targets.map(t => (
                                                    <div key={t.id} className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                        <span className="font-medium text-slate-800">{t.application_name}</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="truncate max-w-[150px]">{t.document_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {new Date(exec.start_time).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    {exec.end_time ? (
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {((new Date(exec.end_time).getTime() - new Date(exec.start_time).getTime()) / 1000).toFixed(1)}s
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full animate-pulse">Running</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {!executions?.length && (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No executions recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Run Success Modal */}
            {
                runSuccessId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all scale-100">
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Execution Started!</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                The analysis pipeline has been triggered successfully.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setRunSuccessId(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Close
                                </button>
                                <Link
                                    to={`/executions/${runSuccessId}`}
                                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    View Live Progress
                                </Link>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
