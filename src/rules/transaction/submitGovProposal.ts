import { IndexedTx } from '@cosmjs/stargate';
import { TransactionRule } from './transactionRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey } from '../../range-sdk/util';

export class SubmitGovProposal extends TransactionRule {
    constructor(private severity: AlertSeverity) {
        super();
    }

    async handle(transaction: IndexedTx, factory: AlertFactory): Promise<void> {

        console.log("Processing SubmitGovProposal for tx " + transaction.hash);

        const events = parseIndexedTxEvents(transaction);

        // find the transfer event
        const message = events.find((event) => event.type === 'message');

        if (message) {
            const action = getAttributeValueByKey(message.attributes, 'action');

            // TODO: extract proposer, initial deposit, proposal type, and title from attributes

            if (action === '/cosmos.gov.v1beta1.MsgSubmitProposal') {
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

    getRuleDescription(): string {
        // TODO: add other attributes from gov proposal message
        return 'A new governance proposal was submitted';
    }

    getRuleName(): string {
        return 'SubmitGovProposal';
    }
}