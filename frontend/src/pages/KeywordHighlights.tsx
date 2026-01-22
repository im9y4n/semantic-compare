import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, FileText, ChevronDown, ChevronRight, XCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { versionsApi } from '../api/client';

export const KeywordHighlights = () => {
    const { id, versionId } = useParams<{ id: string, versionId: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPages, setExpandedPages] = useState<number[]>([]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['matches', versionId],
        queryFn: () => versionsApi.getMatches(versionId!).then(r => r.data),
        enabled: !!versionId,
    });

    const togglePage = (page: number) => {
        setExpandedPages(prev =>
            prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
        );
    };

    const matchesByPage = useMemo(() => {
        if (!data?.matches) return {};

        const grouped: Record<number, typeof data.matches> = {};

        data.matches.forEach(match => {
            if (searchTerm && !match.text.toLowerCase().includes(searchTerm.toLowerCase()) && !match.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
                return;
            }
            if (!grouped[match.page]) {
                grouped[match.page] = [];
            }
            grouped[match.page].push(match);
        });

        return grouped;
    }, [data, searchTerm]);

    const sortedPages = useMemo(() => {
        return Object.keys(matchesByPage).map(Number).sort((a, b) => a - b);
    }, [matchesByPage]);

    const totalMatches = useMemo(() => {
        return Object.values(matchesByPage).flat().length;
    }, [matchesByPage]);

    if (isLoading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="ml-3 text-slate-500">Scanning document for keywords...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-lg max-w-2xl mx-auto mt-12">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load matches</h3>
            <p className="text-red-700">{(error as any).response?.data?.detail || "Could not retrieve matches. Ensure text has been extracted."}</p>
            <Link to={`/documents/${id}`} className="mt-4 inline-block text-red-600 hover:underline">Return to document</Link>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-8 font-sans">
            <Link to={`/documents/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Document
            </Link>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Keyword Search Results</h1>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-slate-500 text-sm">Searching for:</span>
                        <div className="flex gap-2">
                            {data?.keywords.map(k => (
                                <span key={k} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">{totalMatches}</div>
                    <div className="text-sm text-slate-500">Matches Found</div>
                </div>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Filter results..."
                    className="flex-1 bg-transparent outline-none text-slate-700"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Results */}
            <div className="space-y-4">
                {sortedPages.map(page => (
                    <div key={page} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <button
                            onClick={() => togglePage(page)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <span className="font-semibold text-slate-700">Page {page}</span>
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">
                                    {matchesByPage[page].length} matches
                                </span>
                            </div>
                            {expandedPages.includes(page) ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </button>

                        {/* Highlights */}
                        <div className={`divide-y divide-slate-100 ${expandedPages.includes(page) ? 'block' : 'hidden'}`}>
                            {matchesByPage[page].map((match, idx) => (
                                <div key={idx} className="p-4 hover:bg-blue-50/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded border border-yellow-200 text-xs font-bold uppercase tracking-wider">
                                            {match.keyword}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded border border-slate-100">
                                        {/* Simple highlight of the keyword in the text snippet */}
                                        {match.text.split(new RegExp(`(${match.keyword})`, 'gi')).map((part, i) =>
                                            part.toLowerCase() === match.keyword.toLowerCase() ?
                                                <span key={i} className="bg-yellow-200 font-bold text-slate-900 border-b-2 border-yellow-400">{part}</span> :
                                                part
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {sortedPages.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No matches found.
                    </div>
                )}
            </div>
        </div>
    );
};
