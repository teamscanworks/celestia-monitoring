import { Block } from '@cosmjs/stargate';
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { BlockRule } from './blockRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';

export class HighNumberTxs extends BlockRule {
    constructor() {
        super();
    }

    async handle(block: Block, events: StringEvent[], factory: AlertFactory): Promise<void> {
        console.log("Processing HighNumberTxsBlock for block " + block.header.height);
        if (block.txs.length > 10) {
            const alert = factory.create(
                'arabica',
                'active',
                AlertType.Block,
                AlertSeverity.Info,
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