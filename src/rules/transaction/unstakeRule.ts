import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey, resolveAmount } from '../../range-sdk/util';

export class LargeUnstake extends TransactionRule {
    constructor(private threshold: number, private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {

        console.log(`Processing LargeUnstake ${this.severity}  for tx ${transaction.hash}`);

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const message = events.find((event) => event.type === 'message');

        if (message) {
            const action = getAttributeValueByKey(message.attributes, 'action');
            const value = getAttributeValueByKey(message.attributes, 'value');

            if ((action === '/cosmos.staking.v1beta1.MsgUndelegate') && (value)) {
                const amount = resolveAmount(value);
                if (amount.value > this.threshold) {

                    const alert = factory.create(
                        'mocha',
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
    }

    getRuleDescription(): string {
        return 'A large unstake event of ' + this.threshold + ' TIA was detected';
    }

    getRuleName(): string {
        return 'LargeUnstake';
    }
}