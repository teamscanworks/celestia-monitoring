import { Block } from "./block";
import { Message } from "./message";
import { Transaction } from "./transaction";

interface RangeConfig {
    rpcUrl: string;
    network: string;
    chainId: number;
}

export {
    Block,
    Message,
    RangeConfig,
    Transaction,
};