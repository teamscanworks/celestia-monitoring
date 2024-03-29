import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey, resolveAmount } from '../../range-sdk/util';

export class LargeTransfer extends TransactionRule {
    constructor(private threshold: number, private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {
        console.log(`Processing LargeTransfer ${this.severity}  for tx ${transaction.hash}`);

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const transferEvent = events.find((event) => event.type === 'transfer');

        if (transferEvent) {
            const amount = getAttributeValueByKey(transferEvent.attributes, 'amount');
            const sender = getAttributeValueByKey(transferEvent.attributes, 'sender') || '';
            const recipient = getAttributeValueByKey(transferEvent.attributes, 'recipient') || '';

            if (amount) {
                const { value, denom } = resolveAmount(amount);

                if (value > this.threshold && denom === 'TIA') {
                    const alert = factory.create(
                        'mocha',
                        'active',
                        AlertType.Transaction,
                        this.severity,
                        [
                            sender,
                            recipient
                        ],
                        {
                            txHash: transaction.hash,
                            amount: value,
                            denom: denom,
                            sender: sender,
                            recipient: recipient
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
        return 'A transaction with a transfer of more than ' + this.threshold + ' TIA was found';
    }

    getRuleName(): string {
        return 'LargeTransfer';
    }
}