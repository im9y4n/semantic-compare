import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/client';
import { ArrowLeft, Database, HardDrive, FileCode, Clock, Search, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { NewMonitorModal } from '../components/NewMonitorModal';
import { useState } from 'react';

export const DocumentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data: doc, isLoading: isDocLoading } = useQuery({
        queryKey: ['document', id],
        queryFn: () => documentsApi.get(id!).then(r => r.data),
        enabled: !!id
    });

    const { data: versions, isLoading: isVersionsLoading } = useQuery({
        queryKey: ['versions', id],
        queryFn: () => documentsApi.getVersions(id!).then(r => r.data),
        enabled: !!id
    });

    if (isDocLoading || isVersionsLoading) {
        return <div className="text-center p-12 text-slate-500">Loading details...</div>;
    }

    if (!doc) {
        return <div className="text-center p-12 text-red-500">Document not found</div>;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{doc.name}</h1>
                        <p className="text-slate-500 font-mono text-xs">{doc.id}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Edit className="w-4 h-4" />
                    Edit Monitor
                </button>
            </div>

            <NewMonitorModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={{
                    ...doc,
                    // Map keys if necessary, but doc structure mostly matches config except readonly fields
                    document_name: doc.name,
                    keywords: doc.keywords
                }}
            />

            {/* Document Metadata Card */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary-500" />
                        Raw Document Metadata
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Application Name</label>
                        <div className="font-mono text-sm bg-slate-50 p-2 rounded border border-slate-100">{doc.application_name}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Target URL</label>
                        <div className="font-mono text-sm bg-slate-50 p-2 rounded border border-slate-100 break-all">{doc.url}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Schedule</label>
                        <div className="font-mono text-sm bg-slate-50 p-2 rounded border border-slate-100">{doc.schedule}</div>
                    </div>
                </div>
            </div>

            {/* Versions Debug Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-purple-500" />
                        Version History & Storage Paths
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 w-16">#</th>
                                <th className="px-6 py-3">Timestamp / ID</th>
                                <th className="px-6 py-3">Content Hash</th>
                                <th className="px-6 py-3">Scores</th>
                                <th className="px-6 py-3">Storage Path (MinIO/GCS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {versions?.map((v: any, i: number) => (
                                <tr key={v.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{versions.length - i}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{format(new Date(v.timestamp), 'MMM d, yyyy HH:mm:ss')}</div>
                                        <div className="font-mono text-xs text-slate-400 mt-1">{v.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                                            <FileCode className="w-3 h-3" />
                                            {v.content_hash.substring(0, 16)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(v.semantic_score || 0) > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            Sim: {((v.semantic_score || 0) * 100).toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <div className="text-xs font-mono text-slate-500 break-all">
                                                <span className="text-orange-500 font-bold">JSON:</span> {v.extracted_text_path}
                                            </div>
                                            <div className="flex gap-2">
                                                {v.extracted_text_path && (
                                                    <Link
                                                        to={`/documents/${id}/versions/${v.id}/matches`}
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-100 transition-colors border border-yellow-200"
                                                    >
                                                        <Search className="w-3 h-3" />
                                                        View Hits
                                                    </Link>
                                                )}
                                                {v.execution_id && (
                                                    <Link
                                                        to={`/executions/${v.execution_id}`}
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                                    >
                                                        <Clock className="w-3 h-3" />
                                                        Execution Log
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!versions || versions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No versions processed yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
