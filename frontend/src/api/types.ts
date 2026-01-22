export interface Document {
    id: string;
    latest_execution_id?: string;
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

export interface ExecutionStep {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    start_time?: string;
    end_time?: string;
    details?: string;
}

export interface Execution {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    start_time: string;
    end_time?: string;
    logs?: string;
    steps?: ExecutionStep[];
}

export interface ConfigImport {
    documents: {
        application_name: string;
        document_name: string;
        url: string;
        schedule?: string;
    }[];
}

export interface KeywordMatch {
    page: number;
    keyword: string;
    text: string;
}

export interface KeywordMatchResponse {
    matches: KeywordMatch[];
    keywords: string[];
}
