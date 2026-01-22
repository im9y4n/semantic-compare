import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { documentsApi } from '../api/client';
import { ExternalLink, Calendar, MoreHorizontal, FileText, GitCompare } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const ButtonLink = ({ to, children }: { to: string, children: React.ReactNode }) => (
    <Link to={to} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
        {children}
    </Link>
);

export const DocumentList: React.FC = () => {
    const { data: docs, isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.list().then(r => r.data) });

    // Mutation for Quick Run
    const runMutation = React.useMemo(() => {
        // Can't use hook directly inside callback easily, so we can use existing api client directly or simple logic
        // But better to use proper mutation for feedback
        // We will add it inside the component
        return null;
    }, []);

    // We need state for loading specific document run
    const [runningDocId, setRunningDocId] = React.useState<string | null>(null);

    const handleRun = async (docId: string) => {
        setRunningDocId(docId);
        try {
            await executionsApi.run(docId);
            alert("Run triggered successfully");
        } catch (e) {
            console.error(e);
            alert("Failed to run");
        } finally {
            setRunningDocId(null);
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading documents...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Documents</h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Application</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {docs?.map((doc: any) => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center mr-3">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <Link to={`/documents/${doc.id}`} className="text-sm font-medium text-slate-900 hover:text-primary-600 transition-colors">
                                                {doc.name}
                                            </Link>
                                            <a href={doc.url} target="_blank" className="text-xs text-slate-400 hover:text-primary-500 flex items-center gap-1">
                                                {doc.url.length > 30 ? doc.url.substring(0, 30) + '...' : doc.url} <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                        {doc.application_name}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-slate-500">
                                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <RunButton docId={doc.id} />
                                    <DeleteButton docId={doc.id} ownerId={doc.owner_id} onSuccess={() => window.location.reload()} />
                                    <ButtonLink to={`/documents/${doc.id}/compare`}>
                                        <GitCompare className="w-4 h-4" />
                                    </ButtonLink>
                                </td>
                            </tr>
                        ))}
                        {docs?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    No documents found. Import a configuration to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

import { Play } from 'lucide-react';
import { executionsApi } from '../api/client';
// useMutation is already imported from @tanstack/react-query

const RunButton = ({ docId }: { docId: string }) => {
    const role = localStorage.getItem('user_role') || 'admin';
    const canRun = ['admin', 'manager', 'owner'].includes(role);

    const mutation = useMutation({
        mutationFn: () => executionsApi.run(docId),
        onSuccess: () => alert('Run triggered'),
        onError: () => alert('Run failed')
    });

    if (!canRun) return null;

    return (
        <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Run Analysis Now"
        >
            {mutation.isPending ? (
                <span className="block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
                <Play className="w-4 h-4" />
            )}
        </button>
    )
}

import { Trash2 } from 'lucide-react';
const DeleteButton = ({ docId, ownerId, onSuccess }: { docId: string, ownerId?: string, onSuccess: () => void }) => {
    const role = localStorage.getItem('user_role') || 'admin';

    // Mock user ID logic to match backend Mock
    const currentUserId = `user-${role}`; // e.g. user-admin, user-owner, user-manager

    const canDelete = role === 'admin' || (['manager', 'owner'].includes(role) && ownerId === currentUserId);

    const mutation = useMutation({
        mutationFn: () => documentsApi.delete(docId),
        onSuccess: () => {
            alert('Document deleted');
            onSuccess();
        },
        onError: () => alert('Failed to delete document')
    });

    if (!canDelete) return null;

    return (
        <button
            onClick={() => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                    mutation.mutate();
                }
            }}
            disabled={mutation.isPending}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Document"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
