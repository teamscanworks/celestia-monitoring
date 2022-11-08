import { AppDBClient } from './AppDBClient';
import { AlertEventFactory } from './alert/model/alert-event';
import { RuleOffsetManager } from './alert/RuleOffsetManager';
import { RuleProcessor } from './alert/processors/RuleProcessor';
import { RuleType } from './alert/model/alert-rule';
import { ValueTransactionProcessor } from './alert/processors/ValueTransactionProcessor';
import { BDDBClientProvider } from './bcDBClientProvider';

export class AlertWorker {
    private processors: Record<RuleType, RuleProcessor>;

    constructor(
        private bddbClientProvider: BDDBClientProvider,
        private appdbClient: AppDBClient,
        private alertEventFactory: AlertEventFactory,
        private offsetManager: RuleOffsetManager,
        //private cosmosClientProvider: CosmosClientProvider,
        //private notificationManager: NotificationManager,
    ) {
        this.processors = this.buildProcessors();
    }

    async start() {
        const rules = await this.appdbClient.getRules();

        await Promise.all(rules.map((r) => this.processors[r.ruleType].process(r)));
    }

    private buildProcessors(): Record<RuleType, RuleProcessor> {
        return {
            valueTransaction: new ValueTransactionProcessor(
                this.bddbClientProvider,
                this.appdbClient,
                this.alertEventFactory,
                this.offsetManager,
            )
        };
    }
}
