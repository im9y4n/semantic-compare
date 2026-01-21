import React from 'react';
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
                        <div key={exec.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg mt-1 ${exec.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                        exec.status === 'failed' ? 'bg-red-50 text-red-600' :
                                            'bg-amber-50 text-amber-600 animate-pulse'
                                    }`}>
                                    {exec.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                        exec.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> :
                                            <Activity className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{exec.status}</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">{exec.id}</p>
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
