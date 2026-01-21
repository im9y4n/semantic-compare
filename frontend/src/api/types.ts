export interface Document {
    id: string;
    application_name: string;
    name: string;
    url: string;
    schedule: string;
    created_at: string;
}

export interface Version {
    id: string;
    document_id: string;
    timestamp: string;
    semantic_score: number;
    gcs_path: string;
}

export interface Execution {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    start_time: string;
    end_time?: string;
}

export interface ConfigImport {
    documents: {
        application_name: string;
        document_name: string;
        url: string;
        schedule?: string;
    }[];
}
