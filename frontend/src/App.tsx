import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentList } from './pages/DocumentList';
import { DocumentDetails } from './pages/DocumentDetails';
import { ComparisonView } from './pages/ComparisonView';
import { ExecutionsList } from './pages/ExecutionsList';

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
                        <Route path="documents/:id/compare" element={<ComparisonView />} />
                        <Route path="executions" element={<ExecutionsList />} />
                        {/* Add other routes here */}
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
