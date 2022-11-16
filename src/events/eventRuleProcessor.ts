import { AppDBClient } from '../database/appDBClient';
import { BDDBClient } from '../database/bcDBClient';
import { Message } from '../range-sdk/message';
import { EventEventFactory } from '../range-sdk/event';

export abstract class EventRuleProcessor {
    constructor(
        protected bddbClient: BDDBClient,
        protected appdbClient: AppDBClient,
        protected eventEventFactory: EventEventFactory,
    ) { }

    abstract process(network: string): Promise<void>;

    public getNewOffset(messages: Message[]): number | null {
        if (!messages.length) {
            return null;
        }
        return Math.max(...messages.map((a) => a.height));
    }
}
