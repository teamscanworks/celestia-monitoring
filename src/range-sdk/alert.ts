import { randomUUID } from 'crypto';
import { green, yellow, redBright, red, whiteBright } from 'chalk';

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

    public pprint(alert: Alert, ruleName: string, ruleDescription: string): void {

        switch (alert.severity) {
            case AlertSeverity.Info:
                console.log(`${green(alert.severity.toString())} ALERT: ${ruleName} type. ${ruleDescription}`);
                break;
            case AlertSeverity.Low:
                console.log(`${yellow(alert.severity.toString())} ${ruleName} type. ${ruleDescription}`);
                break;
            case AlertSeverity.Medium:
                console.log(`${redBright(alert.severity.toString())} ${ruleName} type. ${ruleDescription}`);
                break;
            case AlertSeverity.High:
                console.log(`${red(alert.severity.toString())} ${ruleName} type. ${ruleDescription}`);
                break;
            case AlertSeverity.Critical:
                console.log(`${red(alert.severity.toString())} ${ruleName} type. ${ruleDescription}`);
                break;
        }

        console.log(whiteBright(JSON.stringify(alert, null, 2)));
    }
}