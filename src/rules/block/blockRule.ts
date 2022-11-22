import { Block } from '@cosmjs/stargate';
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { Rule } from '../rule';
import { AlertFactory } from '../../range-sdk/alert';


export abstract class BlockRule extends Rule {
    constructor() {
        super();
    }

    abstract handle(block: Block, events: StringEvent[], factory: AlertFactory): Promise<void>;
}