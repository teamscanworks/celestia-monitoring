import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey } from '../../range-sdk/util';

export class CommunityPoolSpend extends TransactionRule {
    constructor(private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const message = events.find((event) => event.type === 'message');

        if (message) {
            const action = getAttributeValueByKey(message.attributes, 'action');
            if (action === '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend') {
                const alert = factory.create(
                    'arabica',
                    'active',
                    AlertType.Message,
                    this.severity,
                    [],
                    {
                        txHash: transaction.hash,
                        action: action,
                    },
                    new Date(),
                    true
                );

                // TODO: create a print function for alerts
                console.log(`${this.severity.toString()} ALERT: ${this.getRuleName()} type. ${this.getRuleDescription()}`);
                console.log(JSON.stringify(alert, null, 2));
            }
        }
    }

    getRuleDescription(): string {
        return 'Community pool funds spent';
    }

    getRuleName(): string {
        return 'CommunityPoolSpend';
    }
}