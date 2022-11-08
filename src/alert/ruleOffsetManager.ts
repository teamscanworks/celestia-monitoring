import { AppDBClient } from '../AppDBClient';

export interface RuleOffsetManager {
    commit(ruleId: string, offset: number): Promise<void>;

    getLastCommittedHeight(ruleId: string): Promise<number | null>;
}

export class DBRuleOffsetManager implements RuleOffsetManager {
    constructor(private appdbClient: AppDBClient) { }

    commit(ruleId: string, offset: number): Promise<void> {
        return this.appdbClient.setRuleOffset(ruleId, offset);
    }

    async getLastCommittedHeight(ruleId: string): Promise<number | null> {
        const lastCommittedHeight = await this.appdbClient.getRuleOffset(ruleId);
        if (lastCommittedHeight) {
            return lastCommittedHeight;
        }
        return null;
    }
}
