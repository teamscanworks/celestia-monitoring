import { IndexedTx } from '@cosmjs/stargate';
import { AlertFactory } from '../../range-sdk/alert';
import { Rule } from '../../range-sdk/rule';

export abstract class TransactionRule extends Rule {
    constructor() {
        super();
    }

    abstract handle(block: IndexedTx, factory: AlertFactory): Promise<void>;
}