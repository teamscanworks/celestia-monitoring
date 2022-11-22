import { IndexedTx } from '@cosmjs/stargate';
import { Block } from '@cosmjs/stargate';
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { AlertFactory } from './alert';

export abstract class Rule {
    constructor() { }

    abstract getRuleName(): string;
    abstract getRuleDescription(): string;

}


export abstract class TransactionRule extends Rule {
    constructor() {
        super();
    }

    abstract handle(block: IndexedTx, factory: AlertFactory): Promise<void>;
}


export abstract class BlockRule extends Rule {
    constructor() {
        super();
    }

    abstract handle(block: Block, events: StringEvent[], factory: AlertFactory): Promise<void>;
}