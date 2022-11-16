import { Message } from '../../range-sdk/message';
import { BiOperator, getBiOperator } from '../../utils/operators/BiOperator';
import { AlertEvent } from '../model/alert-event';
import { AlertRule } from '../model/alert-rule';
import { MessageRuleProcessor } from './MessageRuleProcessor';

export class ValueTransactionProcessor extends MessageRuleProcessor {
    private readonly matcher = new ValueTransactionProcessor.Matcher();

    override findMessages(
        alertRule: AlertRule,
        addresses: string[],
        afterHeight: number,
    ): Promise<Message[]> {
        return this.bddbClientProvider.getClient(alertRule.network).getMessagesByType(addresses, 'cosmos.bank.v1beta1.MsgSend', afterHeight);
    }

    override async findAlertEvents(
        messages: Message[],
        alertRule: AlertRule,
        addresses: string[],
    ): Promise<AlertEvent[]> {
        const matchingMessages = messages.filter((m) => this.matcher.matches(alertRule, m));
        return Promise.all(
            matchingMessages.map(async (m) =>
                this.alertEventFactory.create(m.transaction_hash, m.height, alertRule, addresses, {}),
            ),
        );
    }

    static Matcher = class {
        matches(alertRule: AlertRule, message: Message): boolean {
            const denom = 'uosmo'; // in the future, this should be extracted from the rule's params
            const amounts = message.value.amount;
            const operator = getBiOperator(alertRule.parameters.comparator);
            const thresholdValue = parseFloat(alertRule.parameters.thresholdValue);
            return amounts.some((am: any) => this.amountMatches(denom, am, operator, thresholdValue));
        }

        private amountMatches(
            denom: string,
            amount: any,
            operator: BiOperator<number, number, boolean>,
            thresholdValue: number,
        ): boolean {
            if (amount.denom !== denom) {
                return false;
            }
            return operator.apply(parseFloat(amount.amount), thresholdValue);
        }
    };
}
