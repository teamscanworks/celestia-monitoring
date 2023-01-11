import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey } from '../../range-sdk/util';

export class SoftwareUpgradeRule extends TransactionRule {
    constructor(private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {

        console.log("Processing SoftwareUpgradeMsg for tx " + transaction.hash);

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const message = events.find((event) => event.type === 'message');

        if (message) {
            const action = getAttributeValueByKey(message.attributes, 'action');

            if (action === '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade') {
                const alert = factory.create(
                    'mocha',
                    'active',
                    AlertType.Info,
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
        // TODO: add other attributes from gov proposal message
        return 'A Software Upgrade msg was submitted';
    }

    getRuleName(): string {
        return 'SoftwareUpgradeMsg';
    }
}