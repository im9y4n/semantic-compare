import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, DocumentConfig } from '../api/client';
import { X, Loader2, Upload, Link, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { CronPicker } from './CronPicker';

interface NewMonitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: DocumentConfig & { id: string };
    onSuccess?: () => void;
}

export const NewMonitorModal: React.FC<NewMonitorModalProps> = ({ isOpen, onClose, initialData, onSuccess }) => {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'url' | 'file'>('url');
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        application_name: '',
        document_name: '',
        url: '',
        keywords: '',
        schedule: 'weekly'
    });

    // Initialize form with data if provided
    React.useEffect(() => {
        if (initialData) {
            // Robustly map data, handling potential missing keys if types are loose
            setFormData({
                application_name: initialData.application_name || '',
                // Fallback to 'name' if 'document_name' is missing (handle Backend vs Config object differences)
                document_name: initialData.document_name || (initialData as any).name || '',
                url: initialData.url || '',
                keywords: initialData.keywords?.join(', ') || '',
                schedule: initialData.schedule || 'weekly'
            });
            // Auto-detect mode based on URL
            if (initialData.url && initialData.url.startsWith("internal://")) {
                setMode('file');
            } else {
                setMode('url');
            }
        } else {
            setFormData({ application_name: '', document_name: '', url: '', keywords: '', schedule: 'weekly' });
        }
    }, [initialData, isOpen]);

    const [successDocId, setSuccessDocId] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            // Process keywords
            const keywordList = data.keywords ? data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : [];

            // Base payload creation depends on mode, but let's prepare common fields
            let payload = {
                ...data,
                keywords: keywordList
            };

            if (initialData) {
                // UPDATE MODE: Robust Fallback Logic
                // If the user didn't touch a field (or it's empty), fallback to the original initialData to ensure valid payload
                payload = {
                    application_name: data.application_name || initialData.application_name,
                    // Handle potential schema mismatch (Backend 'name' vs Config 'document_name')
                    document_name: data.document_name || initialData.document_name || (initialData as any).name,
                    url: data.url || initialData.url,
                    schedule: data.schedule || initialData.schedule,
                    keywords: keywordList.length > 0 ? keywordList : (initialData.keywords || [])
                };

                // Use the new client method for consistency
                return documentsApi.update(initialData.id, payload);
            } else {
                // CREATE MODE
                if (mode === 'url') {
                    return documentsApi.create(payload);
                } else {
                    if (!file) throw new Error("No file selected");

                    // 1. Upload File
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    const uploadRes = await axios.post('http://localhost:8000/api/v1/upload/upload', uploadFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    // 2. Create Document with internal URL
                    return documentsApi.create({
                        ...payload,
                        url: uploadRes.data.url
                    });
                }
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            if (initialData) {
                queryClient.invalidateQueries({ queryKey: ['document', initialData.id] });
                onSuccess?.();
                onClose();
            } else {
                // Don't close, show success
                setSuccessDocId(data.data.latest_execution_id || data.data.id);
                setFormData({ application_name: '', document_name: '', url: '', keywords: '', schedule: 'weekly' });
                setFile(null);
            }
        },
        onError: (err: any) => {
            alert('Failed to save monitor: ' + (err.response?.data?.detail?.[0]?.msg || err.message));
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">
                        {successDocId ? 'Monitor Created' : (initialData ? 'Edit Monitor' : 'Add New Monitor')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {successDocId ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Success!</h3>
                        <p className="text-slate-500 mb-8">
                            Your document monitor has been configured and the initialization pipeline has started.
                        </p>
                        <div className="flex flex-col gap-3">
                            <a
                                href={`/executions/${successDocId}`}
                                className="w-full py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                            >
                                <Loader2 className="w-4 h-4 animate-spin" />
                                View Live Execution
                            </a>
                            <button
                                onClick={() => {
                                    setSuccessDocId(null);
                                    // Reset form happens in onSuccess
                                }}
                                className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Add Another Monitor
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="px-6 pt-4 flex gap-4 border-b border-slate-100">
                            <button
                                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === 'url' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setMode('url')}
                            >
                                <span className="flex items-center gap-2"><Link className="w-4 h-4" /> Web URL</span>
                            </button>
                            <button
                                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === 'file' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setMode('file')}
                            >
                                <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Local File</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Application Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.application_name}
                                        onChange={e => setFormData({ ...formData, application_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. HR Portal"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Document Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.document_name}
                                        onChange={e => setFormData({ ...formData, document_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. Policy PDF"
                                    />
                                </div>
                            </div>

                            {mode === 'url' ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Document URL</label>
                                    <input
                                        type="url"
                                        required={mode === 'url'}
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-slate-600"
                                        placeholder="https://example.com/document.pdf"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Upload File</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            required={mode === 'file'}
                                            onChange={e => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        {file ? (
                                            <div className="text-sm text-slate-700 font-medium flex flex-col items-center gap-2">
                                                <div className="bg-slate-100 p-2 rounded-full"><Upload className="w-5 h-5 text-slate-600" /></div>
                                                {file.name}
                                                <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-500 flex flex-col items-center gap-2">
                                                <div className="bg-slate-50 p-2 rounded-full"><Upload className="w-5 h-5 text-slate-400" /></div>
                                                <span className="font-medium text-slate-600">Click to upload</span> or drag and drop
                                                <span className="text-xs">PDF, HTML (Max 10MB)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <CronPicker
                                    value={formData.schedule || "weekly"}
                                    onChange={(val) => setFormData({ ...formData, schedule: val })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">
                                    Keywords <span className="text-xs font-normal lowercase text-slate-400">(optional, comma-separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.keywords}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. immunization, billing, pharmacy"
                                />
                                <p className="text-[10px] text-slate-400">
                                    Provide keywords to filter logic. Pages containing these keywords (+/- 2 pages) will be analyzed.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {initialData ? 'Save Changes' : 'Create Monitor'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
