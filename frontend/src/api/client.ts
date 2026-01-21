import axios from 'axios';
import { Document, Execution, ConfigImport } from './types';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Stats {
    documents_count: number;
    executions_count: number;
    versions_count: number;
    active_workers: string;
}

export const executionsApi = {
    run: () => api.post<{ execution_id: string }>('/executions/run'),
    list: () => api.get<Execution[]>('/executions'),
};

export const configApi = {
    import: (data: ConfigImport) => api.post('/config/import', data),
};


export const documentsApi = {
    list: () => api.get<Document[]>('/documents'),
    get: (id: string) => api.get<Document>(`/documents/${id}`),
    create: (data: any) => api.post('/documents', data),
    getVersions: (id: string) => api.get<any[]>(`/documents/${id}/versions`),
};

export const versionsApi = {
    getContent: (id: string) => api.get<{ content: string }>(`/versions/${id}/content`),
};

export const statsApi = {
    get: () => api.get<Stats>('/stats'),
};


export default api;
