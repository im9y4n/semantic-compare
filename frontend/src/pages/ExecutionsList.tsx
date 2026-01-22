import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { executionsApi } from '../api/client';
import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const ExecutionsList: React.FC = () => {
    const { data: executions, isLoading } = useQuery({ queryKey: ['executions'], queryFn: () => executionsApi.list().then(r => r.data) });

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading executions...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Execution History</h1>

            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {executions?.map((exec) => (
                        <div key={exec.id}>
                            <Link to={`/executions/${exec.id}`} className="block p-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg mt-1 ${exec.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                            exec.status === 'failed' ? 'bg-red-50 text-red-600' :
                                                'bg-amber-50 text-amber-600 animate-pulse'
                                            }`}>
                                            {exec.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                                exec.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> :
                                                    <Activity className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0 ml-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{exec.status}</h3>
                                                <span className="text-xs font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                                    {exec.id.substring(0, 8)}
                                                </span>
                                            </div>

                                            {/* Targets Display */}
                                            <div className="mt-1 flex flex-wrap gap-2 items-center">
                                                {exec.targets && exec.targets.length > 0 ? (
                                                    exec.targets.map(t => (
                                                        <div key={t.id} className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                            <span className="font-medium text-slate-800">{t.application_name}</span>
                                                            <span className="text-slate-400">•</span>
                                                            <span className="truncate max-w-[200px]">{t.document_name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No targets (Pending or System)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center text-sm text-slate-600 justify-end">
                                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                            {format(new Date(exec.start_time), 'MMM d, yyyy HH:mm:ss')}
                                        </div>
                                        {exec.end_time && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Duration: {((new Date(exec.end_time).getTime() - new Date(exec.start_time).getTime()) / 1000).toFixed(1)}s
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                    {executions?.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            No executions recorded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
