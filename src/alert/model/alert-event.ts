import { randomUUID } from 'crypto';
import LRUCache from 'lru-cache';
import { AlertRule } from './alert-rule';
import { Block } from '../../model/block';
import { BDDBClientProvider } from '../../bcDBClientProvider';

export interface AlertEvent {
    id: string;
    ruleId: string;
    time: Date;
    txHash: string;
    blockNumber: number;
    network: string;
    addressesInvolved: string;
    details: any;
}

export class AlertEventFactory {
    private blockCache: LRUCache<number, Block>;

    constructor(private bddbClientProvider: BDDBClientProvider) {
        this.blockCache = new LRUCache({ max: 150 });
    }

    async create(
        txHash: string,
        height: number,
        alertRule: AlertRule,
        addresses: string[],
        details: any = {},
    ): Promise<AlertEvent> {
        const block = await this.getBlock(height, alertRule.network);
        return {
            id: randomUUID(),
            ruleId: alertRule.id,
            time: block.timestamp,
            txHash,
            blockNumber: height,
            network: 'mamaki', // todo: don't hardcode this value
            addressesInvolved: `{${addresses.join(',')}}`,
            details,
        };
    }

    private async getBlock(height: number, network: string): Promise<Block> {
        const cached = this.blockCache.get(height);
        if (cached) {
            return cached;
        }
        const block = await this.bddbClientProvider.getClient(network).getBlock(height);
        this.blockCache.set(height, block);
        return block;
    }
}
