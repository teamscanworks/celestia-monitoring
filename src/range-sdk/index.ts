import { Block } from "./block";
import { Transaction } from "./transaction";

interface RangeConfig {
    rpcUrl: string;
    network: string;
    chainId: number;
}

export {
    Block,
    RangeConfig,
    Transaction,
};

// TODO: aggregate exports here