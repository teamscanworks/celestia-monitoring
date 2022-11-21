import { Block, IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey, resolveAmount } from '../../range-sdk/util';

export class LargeTransfer extends TransactionRule {
    constructor() { // TODO: add amount threshold and severity as constructor parameters
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {
        console.log("Processing LargeTransfer for tx " + transaction.hash);

        const events = parseIndexedTxEvents(transaction);

        // log all events
        events.forEach((event) => {
            console.log(`Event: ${event.type}`)
            console.log(`Attributes: ${JSON.stringify(event.attributes, null, '\t')}`)
        });

        // find the transfer event
        const transferEvent = events.find((event) => event.type === 'transfer');

        if (transferEvent) {
            const amount = getAttributeValueByKey(transferEvent.attributes, 'amount');
            console.log(`Amount: ${amount}`);

            if (amount) {
                const { value, denom } = resolveAmount(amount);

                console.log(`Amount value: ${value}`);
                console.log(`Amount denom: ${denom}`);

                console.log(JSON.stringify(alert));

            }
        }
    }

    getRuleDescription(): string {
        return 'A large transfer of TIA has occured';
    }

    getRuleName(): string {
        return 'LargeTransfer';
    }
}