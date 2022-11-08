export type RuleType =
    | 'successTransaction'
    | 'failedTransaction'
    | 'valueTransaction'
    | 'IBCTransfer'
    | 'messageExecution'
    | 'eventsEmitted'
    | 'cosmosStateChange'
    | 'balanceChange';

export type Target = 'address' | 'tag' | 'message';

export interface AlertRule {
    id: string;
    userId: string;
    ruleType: RuleType;
    target: Target;
    tags: string[];
    addresses: string[];
    parameters: any;
    createdAt: Date;
    network: string;
}
