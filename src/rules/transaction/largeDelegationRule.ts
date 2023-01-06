import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey, resolveAmount } from '../../range-sdk/util';

export class LargeDelegation extends TransactionRule {
    constructor(private threshold: number, private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {
        console.log(`Processing LargeDelegation ${this.severity}  for tx ${transaction.hash}`);

        const events = parseIndexedTxEvents(transaction);

        // find the delegation event
        const transferEvent = events.find((event) => event.type === 'delegate');

        if (transferEvent) {
            const amount = getAttributeValueByKey(transferEvent.attributes, 'amount');
            const validator = getAttributeValueByKey(transferEvent.attributes, 'validator') || '';

            if (amount) {
                const { value, denom } = resolveAmount(amount);

                if (value > this.threshold && denom === 'TIA') {
                    const alert = factory.create(
                        'arabica',
                        'active',
                        AlertType.Transaction,
                        this.severity,
                        [
                            validator
                        ],
                        {
                            txHash: transaction.hash,
                            amount: value,
                            denom: denom,
                            validator: validator
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
        return 'A delegation of more than ' + this.threshold + ' TIA was found';
    }

    getRuleName(): string {
        return 'LargeDelegation';
    }
}