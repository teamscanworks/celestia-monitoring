import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey } from '../../range-sdk/util';

export class ValidatorUnjailed extends TransactionRule {
    constructor(private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {

        console.log("Processing ValidatorUnjailed for tx " + transaction.hash);

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const message = events.find((event) => event.type === 'message');

        if (message) {
            const action = getAttributeValueByKey(message.attributes, 'action');
            if (action === '/cosmos.slashing.v1beta1.MsgUnjail') {
                const validator = getAttributeValueByKey(message.attributes, 'sender')
                const alert = factory.create(
                    'mocha',
                    'active',
                    AlertType.Message,
                    this.severity,
                    [
                        validator || 'unknown'
                    ],
                    {
                        txHash: transaction.hash,
                        action: action,
                        validator: validator,
                    },
                    new Date(),
                    true
                );

                factory.pprint(alert, this.getRuleName(), this.getRuleDescription());
            }
        }
    }

    getRuleDescription(): string {
        return 'A validator has been unjailed';
    }

    getRuleName(): string {
        return 'ValidatorUnjailed';
    }
}