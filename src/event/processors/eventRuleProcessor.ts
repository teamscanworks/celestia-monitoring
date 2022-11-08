import { AppDBClient } from '../../AppDBClient';
import { BDDBClient } from '../../bcDBClient';
import { Message } from '../../model/message';
import { EventEventFactory } from '../model/event-event';

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
