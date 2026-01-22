import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentList } from './pages/DocumentList';
import { DocumentDetails } from './pages/DocumentDetails';
import { ComparisonView } from './pages/ComparisonView';
import { ExecutionDetails } from './pages/ExecutionDetails';
import { ExecutionsList } from './pages/ExecutionsList';
import { KeywordHighlights } from './pages/KeywordHighlights';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="documents" element={<DocumentList />} />
                        <Route path="documents/:id" element={<DocumentDetails />} />
                        <Route path="documents/:id/versions/:versionId/matches" element={<KeywordHighlights />} />
                        <Route path="documents/:id/compare" element={<ComparisonView />} />
                        <Route path="executions" element={<ExecutionsList />} />
                        <Route path="executions/:id" element={<ExecutionDetails />} /> {/* Added new route */}
                        {/* Add other routes here */}
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
