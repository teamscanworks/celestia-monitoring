import { Block } from '@cosmjs/stargate';
import { BlockRule } from './blockRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';

export class HighNumberTxs extends BlockRule {
    constructor() {
        super();
    }

    async handle(block: Block, factory: AlertFactory): Promise<void> {
        console.log("Processing HighNumberTxsBlock for block " + block.header.height);
        if (block.txs.length > 10) {
            const alert = factory.create(
                'arabica',
                'active',
                AlertType.Block,
                AlertSeverity.High,
                [],
                {
                    blockHeight: block.header.height,
                    txs: block.txs.length
                },
                new Date(),
                true
            );

            console.log(JSON.stringify(alert));

        }
    }

    getRuleDescription(): string {
        return 'A block with more than 10 transactions was found';
    }

    getRuleName(): string {
        return 'HighNumberTxsBlock';
    }
}