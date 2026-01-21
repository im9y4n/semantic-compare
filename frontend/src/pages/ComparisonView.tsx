import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentsApi, versionsApi } from '../api/client';
import { ArrowLeft, GitCompare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { diffLines } from 'diff';

export const ComparisonView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [leftVersionId, setLeftVersionId] = useState<string>('');
    const [rightVersionId, setRightVersionId] = useState<string>('');

    const { data: versions } = useQuery({
        queryKey: ['versions', id],
        queryFn: () => documentsApi.getVersions(id!).then(r => r.data),
        enabled: !!id
    });

    const { data: leftContent } = useQuery({
        queryKey: ['content', leftVersionId],
        queryFn: () => versionsApi.getContent(leftVersionId).then(r => r.data.content),
        enabled: !!leftVersionId
    });

    const { data: rightContent } = useQuery({
        queryKey: ['content', rightVersionId],
        queryFn: () => versionsApi.getContent(rightVersionId).then(r => r.data.content),
        enabled: !!rightVersionId
    });

    // Auto-select first two versions
    useEffect(() => {
        if (versions && versions.length >= 2 && !leftVersionId && !rightVersionId) {
            setRightVersionId(versions[0].id);
            setLeftVersionId(versions[1].id);
        } else if (versions && versions.length === 1 && !rightVersionId) {
            setRightVersionId(versions[0].id);
        }
    }, [versions]);

    const changes = React.useMemo(() => {
        if (!leftContent || !rightContent) return [];

        // Helper to parse content
        const parseContent = (content: string) => {
            try {
                // Try parsing as JSON first
                const json = JSON.parse(content);
                if (Array.isArray(json)) {
                    // Assuming list of segments
                    return json.map((s: any) => {
                        const pageLabel = s.page ? `[Page ${s.page}] ` : '';
                        return `${pageLabel}${s.text || s.normalized_text}`;
                    }).join('\n\n');
                }
                return content;
            } catch (e) {
                // If not JSON, return as is (e.g. if we add raw text support later)
                return content;
            }
        };

        const text1 = parseContent(leftContent);
        const text2 = parseContent(rightContent);

        return diffLines(text1, text2);
    }, [leftContent, rightContent]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Version Comparison</h1>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Baseline Version (Old)
                    </label>
                    <select
                        value={leftVersionId}
                        onChange={e => setLeftVersionId(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                        <option value="">Select a version...</option>
                        {versions?.map((v: any) => (
                            <option key={v.id} value={v.id}>
                                {format(new Date(v.timestamp), 'MMM d, yyyy HH:mm')} - Score: {v.semantic_score?.toFixed(2) ?? 'N/A'}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Comparison Version (New)
                    </label>
                    <select
                        value={rightVersionId}
                        onChange={e => setRightVersionId(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                        <option value="">Select a version...</option>
                        {versions?.map((v: any) => (
                            <option key={v.id} value={v.id}>
                                {format(new Date(v.timestamp), 'MMM d, yyyy HH:mm')} - Score: {v.semantic_score?.toFixed(2) ?? 'N/A'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col relative">
                {!leftContent || !rightContent ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Select two versions to compare</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto flex text-xs md:text-sm font-mono">
                        {/* Left Column (Baseline) */}
                        <div className="flex-1 border-r border-slate-100 min-w-0">
                            <div className="sticky top-0 bg-slate-50 border-b border-slate-100 p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center z-10">
                                Baseline
                            </div>
                            <div className="p-4 space-y-1">
                                {changes.map((part, index) => {
                                    if (part.added) return null; // Skip added parts in left column
                                    const style = part.removed ? 'bg-red-50 text-red-900 border-l-2 border-red-400' : 'text-slate-600';
                                    return (
                                        <div key={`l-${index}`} className={`${style} px-2 py-1 whitespace-pre-wrap`}>
                                            {part.value}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column (Comparison) */}
                        <div className="flex-1 min-w-0">
                            <div className="sticky top-0 bg-slate-50 border-b border-slate-100 p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center z-10">
                                New Version
                            </div>
                            <div className="p-4 space-y-1">
                                {changes.map((part, index) => {
                                    if (part.removed) return null; // Skip removed parts in right column
                                    const style = part.added ? 'bg-green-50 text-green-900 border-l-2 border-green-400' : 'text-slate-600';
                                    return (
                                        <div key={`r-${index}`} className={`${style} px-2 py-1 whitespace-pre-wrap`}>
                                            {part.value}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
