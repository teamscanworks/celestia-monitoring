import { Block, IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents } from '../../range-sdk/util';

export class LargeTransfer extends TransactionRule {
    constructor() {
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


        console.log(JSON.stringify(alert));


    }

    getRuleDescription(): string {
        return 'A large transfer of TIA has occured';
    }

    getRuleName(): string {
        return 'LargeTransfer';
    }
}