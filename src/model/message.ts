export interface Message {
    transaction_hash: string;
    height: number;
    value: any;
    involved_accounts_addresses: string[];
}

export type FieldType = 'string' | 'int' | 'coin';

export function messageFieldEquals(a: any, b: any, type: FieldType): boolean {
    switch (type) {
        case 'string':
            return a === b;
        case 'int':
            return parseInt(a) === parseInt(b);
        case 'coin':
            return a.denom === b.denom && parseFloat(a.amount) === parseFloat(b.amount);
        default:
            return false;
    }
}
