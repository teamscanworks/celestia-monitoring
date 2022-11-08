import { logger } from '../../helper/logger';
import { Message } from '../../model/message';
import { EventEvent } from '../model/event-event';
import { EventRuleProcessor } from './eventRuleProcessor';

export class StakeUnstakeProcessor extends EventRuleProcessor {
    public readonly eventName = 'StakeUnstake';

    public readonly eventPrettyName = 'Sensitive stake/unstake event';

    public readonly messageTypeDelegate = 'cosmos.staking.v1beta1.MsgDelegate';

    public readonly messageTypeUndelegate = 'cosmos.staking.v1beta1.MsgUndelegate';

    public readonly amountInfo = 1_000_000_000_000; // 1M CEL tokens

    public readonly amountLow = 5_000_000_000_000; // 5M CEL tokens

    private readonly matcher = new StakeUnstakeProcessor.Matcher();

    async process(network: string) {
        logger.debug(`Processing ${this.eventName}`);
        const offset = await this.appdbClient.getEventRuleOffset(this.eventName, network);
        if (!offset) {
            logger.error({
                message: 'Cannot process event because offset is not set',
                eventName: this.eventName,
            });
            return;
        }
        const delegateMessages = await this.bddbClient.getAllMessagesByType(
            this.messageTypeDelegate,
            offset,
        );
        const [delegateLowMessages, discardedDelegate] = this.matcher.filter(delegateMessages, this.amountLow);
        const [delegateInfoMessages] = this.matcher.filter(discardedDelegate, this.amountInfo);

        const undelegateMessages = await this.bddbClient.getAllMessagesByType(
            this.messageTypeUndelegate,
            offset,
        );
        const [undelegateLowMessages, discardedUndelegate] = this.matcher.filter(undelegateMessages, this.amountLow);
        const [undelegateInfoMessages] = this.matcher.filter(discardedUndelegate, this.amountInfo);

        const delegateInfoEvents: EventEvent[] = await Promise.all(
            delegateInfoMessages.map(
                async (m) =>
                    await this.eventEventFactory.create(
                        m.transaction_hash,
                        m.height,
                        'info',
                        this.eventName,
                        this.eventPrettyName,
                        this.getEventDetails(m, 'high', 'delegate'),
                        network,
                        new Date(),
                    ),
            ),
        );
        const delegateLowEvents: EventEvent[] = await Promise.all(
            delegateLowMessages.map(
                async (m) =>
                    await this.eventEventFactory.create(
                        m.transaction_hash,
                        m.height,
                        'low',
                        this.eventName,
                        this.eventPrettyName,
                        this.getEventDetails(m, 'huge', 'delegate'),
                        network,
                        new Date(),
                    ),
            ),
        );
        const undelegateInfoEvents: EventEvent[] = await Promise.all(
            undelegateInfoMessages.map(
                async (m) =>
                    await this.eventEventFactory.create(
                        m.transaction_hash,
                        m.height,
                        'info',
                        this.eventName,
                        this.eventPrettyName,
                        this.getEventDetails(m, 'high', 'undelegate'),
                        network,
                        new Date(),
                    ),
            ),
        );
        const undelegateLowEvents: EventEvent[] = await Promise.all(
            undelegateLowMessages.map(
                async (m) =>
                    await this.eventEventFactory.create(
                        m.transaction_hash,
                        m.height,
                        'low',
                        this.eventName,
                        this.eventPrettyName,
                        this.getEventDetails(m, 'huge', 'undelegate'),
                        network,
                        new Date(),
                    ),
            ),
        );

        await this.appdbClient.saveEventEvents(delegateInfoEvents);
        await this.appdbClient.saveEventEvents(delegateLowEvents);
        await this.appdbClient.saveEventEvents(undelegateInfoEvents);
        await this.appdbClient.saveEventEvents(undelegateLowEvents);

        logger.debug({
            message: 'Processed Event',
            eventName: this.eventName,
            numberOfEvents:
                delegateInfoEvents.length +
                delegateLowEvents.length +
                undelegateInfoEvents.length +
                undelegateLowEvents.length,
        });
        const newOffset = this.determineNewOffset(
            delegateInfoMessages,
            delegateLowMessages,
            undelegateInfoMessages,
            undelegateLowMessages,
        );
        if (newOffset) {
            await this.appdbClient.setEventRuleOffset(this.eventName, network, newOffset);
        }
        logger.debug(`Finished ${this.eventName}`);
    }

    private determineNewOffset(m1: Message[], m2: Message[], m3: Message[], m4: Message[]) {
        return this.getNewOffset(m1.concat(m2).concat(m3).concat(m4));
    }

    private getEventDetails(m: Message, amountType: string, action: string): any {
        return {
            description: `A ${amountType} amount ${action} action of ${m.value.amount.amount} has been performed by ${m.value.delegator_address}`,
        };
    }

    static Matcher = class {

        //Filter messages and return discarded items
        filter(messages: Message[], threshold: number): [filtered: Message[], discarded: Message[]] {
            let discarded: Message[] = [];
            const filtered = messages.filter((m) => {
                const matches = m.value.amount.amount >= threshold;
                if (!matches) {
                    discarded.push(m);
                }
                return matches;
            });
            return [filtered, discarded];
        }
    };
}
