import { Block } from '@cosmjs/stargate';
import { Rule } from '../rule';
import { AlertFactory } from '../../range-sdk/alert';


export abstract class BlockRule extends Rule {
    constructor() {
        super();
    }

    abstract handle(block: Block, factory: AlertFactory): Promise<void>;
}