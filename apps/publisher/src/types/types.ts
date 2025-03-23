export interface Monitor {
    id: string;
    url: string;
    userId: string;
    createdAt: Date;
}

export interface Connection {
    callback: (payload: ResponsePayload) => void;
    timestamp: number;
}

export interface UrlResult {
    status: number;
    result: boolean;
    responseTime: number;
}
export interface ResponsePayload {
    result: {
        url: string,
        result: UrlResult
    }[];
    id: string,
    validatorId: string
}

export interface ValidationResponse {
    type: string;
    payload: {
        urls: string[];
        id: string;
        validatorId: string;
    }
}
