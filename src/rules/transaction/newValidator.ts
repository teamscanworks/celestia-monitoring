import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey } from '../../range-sdk/util';

export class NewValidatorRule extends TransactionRule {
    constructor(private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {

        console.log("Processing NewValidatorRule for tx " + transaction.hash);

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const message = events.find((event) => event.type === 'message');

        if (message) {
            const action = getAttributeValueByKey(message.attributes, 'action');


            if (action === '/cosmos.staking.v1beta1.MsgCreateValidator') {
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

                factory.pprint(alert, this.getRuleName(), this.getRuleDescription());
            }
        }
    }

    getRuleDescription(): string {
        // TODO: add other attributes such as validator address
        return 'A new validator has been created';
    }

    getRuleName(): string {
        return 'NewValidator';
    }
}