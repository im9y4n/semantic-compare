import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/client';
import { X, Loader2, Upload, Link } from 'lucide-react';
import axios from 'axios';

interface NewMonitorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewMonitorModal: React.FC<NewMonitorModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'url' | 'file'>('url');
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        application_name: '',
        document_name: '',
        url: '',
        schedule: 'weekly'
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (mode === 'url') {
                return documentsApi.create(data);
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
                    ...data,
                    url: uploadRes.data.url
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            onClose();
            setFormData({ application_name: '', document_name: '', url: '', schedule: 'weekly' });
            setFile(null);
            alert('Monitor created successfully!');
        },
        onError: (err: any) => {
            alert('Failed to create monitor: ' + (err.response?.data?.detail?.[0]?.msg || err.message));
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
                    <h2 className="text-lg font-bold text-slate-800">Add New Monitor</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

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
                        <label className="text-xs font-semibold text-slate-500 uppercase">Schedule</label>
                        <select
                            value={formData.schedule}
                            onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
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
                            Create Monitor
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
