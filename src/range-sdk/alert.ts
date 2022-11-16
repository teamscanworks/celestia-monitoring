export interface Alert {
    id: string;
    network: string;
    status: string;
    type: AlertType;
    severity: AlertSeverity;
    addresses_invoved: string[];
    parameters?: JSON;
    createdAt: Date;
    enabled: boolean;
}

export enum AlertSeverity {
    Unknown,
    Info,
    Low,
    Medium,
    High,
    Critical,
}

export enum AlertType {
    Unknown,
    Block,
    Transaction,
    Message,
    Event,
    Info,
    Issue,
    Exploit,
}

export enum AlertStatus {
    Unknown,
    Active,
    Paused,
    Resolved,
}