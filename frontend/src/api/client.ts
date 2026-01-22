import axios from 'axios';
import { Document, Execution, ConfigImport } from './types';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    // For local testing with the new mock backend logic:
    // We send the 'role' name as the Bearer token, which the backend mock logic interprets
    const token = localStorage.getItem('user_role') || 'admin';
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

export interface Stats {
    documents_count: number;
    executions_count: number;
    versions_count: number;
    active_workers: string;
}

export const executionsApi = {
    run: (docId?: string) => api.post<{ execution_id: string }>(`/executions/run${docId ? `?document_id=${docId}` : ''}`),
    list: () => api.get<Execution[]>('/executions'),
};

export const configApi = {
    import: (data: ConfigImport) => api.post('/config/import', data),
};


export const documentsApi = {
    list: () => api.get<Document[]>('/documents'),
    get: (id: string) => api.get<Document>(`/documents/${id}`),
    create: (data: any) => api.post('/documents', data),
    delete: (id: string) => api.delete(`/documents/${id}`),
    getVersions: (id: string) => api.get<any[]>(`/documents/${id}/versions`),
};

export const versionsApi = {
    getContent: (id: string) => api.get<{ content: string }>(`/versions/${id}/content`),
};

export const statsApi = {
    get: () => api.get<Stats>('/stats'),
};


export default api;
