import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey, resolveAmount } from '../../range-sdk/util';

export class LargeRedelegation extends TransactionRule {
    constructor(private threshold: number, private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {
        console.log(`Processing LargeRedelegation ${this.severity}  for tx ${transaction.hash}`);

        const events = parseIndexedTxEvents(transaction);

        // find the redelegation event
        const transferEvent = events.find((event) => event.type === 'redelegate');

        if (transferEvent) {
            const amount = getAttributeValueByKey(transferEvent.attributes, 'amount');
            const sourceValidator = getAttributeValueByKey(transferEvent.attributes, 'source_validator') || '';
            const destinationValidator = getAttributeValueByKey(transferEvent.attributes, 'destination_validator') || '';

            if (amount) {
                const { value, denom } = resolveAmount(amount);

                if (value > this.threshold && denom === 'TIA') {
                    const alert = factory.create(
                        'arabica',
                        'active',
                        AlertType.Transaction,
                        this.severity,
                        [
                            sourceValidator,
                            destinationValidator
                        ],
                        {
                            txHash: transaction.hash,
                            amount: value,
                            denom: denom,
                            sourceValidator: sourceValidator,
                            destinationValidator: destinationValidator
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
        return 'A redelegation of more than ' + this.threshold + ' TIA was found';
    }

    getRuleName(): string {
        return 'LargeRedelegation';
    }
}