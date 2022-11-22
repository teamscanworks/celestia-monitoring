import { AlertFactory } from './range-sdk/alert';
import { Block, IndexedTx } from "@cosmjs/stargate"
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { BlockRule } from './rules/block/blockRule';
import { TransactionRule } from './rules/transaction/transactionRule';


export class BlockWorker {

    private offset: number;
    private alertRules: BlockRule[];
    private alertFactory: AlertFactory;

    constructor(offset: number, alertRules: BlockRule[]) {
        this.offset = offset;
        this.alertRules = alertRules;
        this.alertFactory = new AlertFactory();
    }

    async process(block: Block, events: StringEvent[]): Promise<void> {

        await Promise.all(this.alertRules.map((blockRule) => blockRule.handle(block, events, this.alertFactory)));
    }
}

export class TransactionWorker {

    private offset: number;
    private alertRules: TransactionRule[];
    private alertFactory: AlertFactory;

    constructor(offset: number, alertRules: TransactionRule[]) {
        this.offset = offset;
        this.alertRules = alertRules;
        this.alertFactory = new AlertFactory();
    }

    async process(tx: IndexedTx): Promise<void> {

        await Promise.all(this.alertRules.map((blockRule) => blockRule.handle(tx, this.alertFactory)));
    }
}
