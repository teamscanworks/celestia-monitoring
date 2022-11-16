import { randomUUID } from 'crypto';
import LRUCache from 'lru-cache';
import { BDDBClient } from '../database/bcDBClient';
import { Block } from './block';

export interface EventEvent {
    id: string;
    severity: EventPriority;
    eventName: string;
    eventPrettyName: string;
    details: any;
    network: string;
    date: Date;
    blockNumber: number;
    txHash: string;
    createdAt: Date;
}

export type EventPriority = 'info' | 'low' | 'medium' | 'high' | 'critical';

export class EventEventFactory {
    private blockCache: LRUCache<number, Block>;

    constructor(private bddbClient: BDDBClient) {
        this.blockCache = new LRUCache({ max: 150 });
    }

    async create(
        txHash: string,
        height: number,
        severity: EventPriority,
        eventName: string,
        eventPrettyName: string,
        details: any,
        network: string,
        createdAt: Date,
    ): Promise<EventEvent> {
        const block = await this.getBlock(height);
        return {
            id: randomUUID(),
            severity,
            eventName,
            eventPrettyName,
            details,
            network,
            date: block.timestamp,
            blockNumber: height,
            txHash,
            createdAt,
        };
    }

    private async getBlock(height: number): Promise<Block> {
        const cached = this.blockCache.get(height);
        if (cached) {
            return cached;
        }
        const block = await this.bddbClient.getBlock(height);
        this.blockCache.set(height, block);
        return block;
    }
}
