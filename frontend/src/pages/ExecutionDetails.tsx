import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { executionsApi } from '../api/client';
import { Execution } from '../api/types'; // Assuming types are exported

export const ExecutionDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: execution, isLoading, error } = useQuery({
        queryKey: ['execution', id],
        queryFn: () => executionsApi.get(id!).then(r => r.data),
        enabled: !!id,
        refetchInterval: (query) => {
            // Flexible check for v4/v5 data structure
            const data = (query as any)?.state?.data || query;
            if (data?.status === 'running' || data?.status === 'pending') {
                return 1000;
            }
            return false;
        }
    });

    if (isLoading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-slate-500">Loading execution details...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <div className="inline-flex p-3 bg-red-100 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Failed to load execution</h3>
            <p className="text-slate-500 mt-2">The requested execution could not be found or the server is having trouble.</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 hover:underline">Go Back</button>
        </div>
    );

    if (!execution) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            default: return <div className="w-5 h-5 rounded-full border-2 border-slate-200" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 border-emerald-200';
            case 'failed': return 'bg-red-50 border-red-200';
            case 'running': return 'bg-blue-50 border-blue-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Execution Details</h1>
                        <p className="text-sm text-slate-500 font-mono mt-1">{execution.id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${execution.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        execution.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {getStatusIcon(execution.status)}
                        <span className="capitalize">{execution.status}</span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Steps Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Pipeline Steps</h2>

                        <div className="relative space-y-0">
                            {/* Vertical Line */}
                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 -z-10" />

                            {execution.steps?.map((step, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="relative pt-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${getStatusColor(step.status)}`}>
                                            {getStatusIcon(step.status)}
                                        </div>
                                    </div>
                                    <div className="flex-1 pb-8">
                                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group-hover:border-slate-300 transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold text-slate-800">{step.name}</h3>
                                                {step.end_time && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(step.end_time).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                            {step.details && (
                                                <p className="text-sm text-slate-600 mt-1">{step.details}</p>
                                            )}
                                            {step.status === 'running' && (
                                                <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 animate-progress origin-left" style={{ width: '60%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!execution.steps || execution.steps.length === 0) && (
                                <div className="text-center py-12 text-slate-400">
                                    No steps recorded yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Metadata & Logs */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Execution Specs
                            </h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-slate-500">Started</dt>
                                    <dd className="font-medium text-slate-900">{new Date(execution.start_time).toLocaleString()}</dd>
                                </div>
                                {execution.end_time && (
                                    <div>
                                        <dt className="text-slate-500">Ended</dt>
                                        <dd className="font-medium text-slate-900">{new Date(execution.end_time).toLocaleString()}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {execution.logs && (
                            <div className="bg-slate-900 rounded-lg p-4 overflow-hidden">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">System Logs</h3>
                                <pre className="text-xs text-green-400 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                                    {execution.logs}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
