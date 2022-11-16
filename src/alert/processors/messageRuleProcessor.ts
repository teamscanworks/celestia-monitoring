import { AppDBClient } from '../../database/appDBClient';
import { Message } from '../../range-sdk/message';
import { RuleOffsetManager } from '../RuleOffsetManager';
import { AlertEvent, AlertEventFactory } from '../model/alert-event';
import { AlertRule } from '../model/alert-rule';
//import { NotificationManager } from '../notification/NotificationManager';
import { RuleProcessor } from './RuleProcessor';
import { logger } from '../../helper/logger';
import { BDDBClientProvider } from '../../database/bcDBClientProvider';

export abstract class MessageRuleProcessor implements RuleProcessor {
    constructor(
        protected bddbClientProvider: BDDBClientProvider,
        protected appdbClient: AppDBClient,
        protected alertEventFactory: AlertEventFactory,
        private offsetManager: RuleOffsetManager,
        //private notificationManager: NotificationManager,
    ) { }

    async process(alertRule: AlertRule) {
        const { addresses, lastCommittedHeight } = await this.getParams(alertRule);
        const messages = await this.findMessages(alertRule, addresses, lastCommittedHeight);
        const events = await this.findAlertEvents(messages, alertRule, addresses);
        await this.appdbClient.saveAlertEvents(events);
        //await this.notificationManager.notify(alertRule.id, events);
        const newOffset = this.getNewOffset(messages);
        if (newOffset) {
            await this.offsetManager.commit(alertRule.id, newOffset);
        }
        logger.debug({
            message: 'Processed Rule',
            alertRuleId: alertRule.id,
            alertRuleType: alertRule.ruleType,
            blocksWithAddresses: messages.map((m) => m.height),
            numberOfEvents: events.length,
            lastCommittedHeight,
            newOffset,
        });
    }

    abstract findMessages(
        alertRule: AlertRule,
        addresses: string[],
        afterHeight: number,
    ): Promise<Message[]>;

    abstract findAlertEvents(
        messages: Message[],
        alertRule: AlertRule,
        addresses: string[],
    ): Promise<AlertEvent[]>;

    private async getParams(
        alertRule: AlertRule,
    ): Promise<{ addresses: string[]; lastCommittedHeight: number }> {
        const addressesP = this.getAddresses(alertRule);
        const lastCommittedHeightP = this.getLastCommitedHeight(alertRule);
        return {
            addresses: await addressesP,
            lastCommittedHeight: await lastCommittedHeightP,
        };
    }

    private async getLastCommitedHeight(alertRule: AlertRule): Promise<number> {
        let lastCommittedHeight = await this.offsetManager.getLastCommittedHeight(alertRule.id);
        if (lastCommittedHeight === null) {
            lastCommittedHeight = await this.bddbClientProvider.getClient(alertRule.network).getLastBlockHeightBefore(alertRule.createdAt);
            await this.offsetManager.commit(alertRule.id, lastCommittedHeight);
        }
        return lastCommittedHeight;
    }

    private async getAddresses(alertRule: AlertRule): Promise<string[]> {
        switch (alertRule.target) {
            case 'address':
                return alertRule.addresses;
            case 'tag':
                return this.appdbClient.getAddressesForTags(alertRule.tags);
            case 'message':
            default:
                return Promise.resolve([]);
        }
    }

    private getNewOffset(messages: Message[]): number | null {
        if (!messages.length) {
            return null;
        }
        return Math.max(...messages.map((a) => a.height));
    }

}
