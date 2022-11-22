import { randomUUID } from 'crypto';

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
    Unknown = 'UNKNOWN',
    Info = 'INFO',
    Low = 'LOW',
    Medium = 'MEDIUM',
    High = 'HIGH',
    Critical = 'CRITICAL',
}

export enum AlertType {
    Unknown = 'UNKNOWN',
    Block = 'BLOCK',
    Transaction = 'TRANSACTION',
    Message = 'MESSAGE',
    Event = 'EVENT',
    Info = 'INFO',
    Issue = 'ISSUE',
    Exploit = 'EXPLOIT',
}

export enum AlertStatus {
    Unknown,
    Active,
    Paused,
    Resolved,
}

export class AlertFactory {

    public create(
        network: string,
        status: string,
        type: AlertType,
        severity: AlertSeverity,
        addresses_invoved: string[],
        parameters?: any,
        createdAt?: Date,
        enabled?: boolean,
    ): Alert {
        return {
            id: randomUUID(),
            network,
            status,
            type,
            severity,
            addresses_invoved,
            parameters,
            createdAt: createdAt || new Date(),
            enabled: enabled || true,
        };
    }
}