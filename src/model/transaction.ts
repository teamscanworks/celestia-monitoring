export interface Transaction {
    hash: string;
    success: boolean;
    height: number;
    logs: TransactionLog[];
}

export interface TransactionLog {
    events: TransactionEvent[];
}

export interface TransactionEvent {
    type: string;
    attributes: KeyValuePair[];
}

export interface KeyValuePair {
    key: string;
    value: string;
}
