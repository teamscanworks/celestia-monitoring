import { Block } from '../range-sdk/block';
import { Message } from '../range-sdk/message';
import { Transaction } from '../range-sdk/transaction';
import { SQLClient } from './client';

const TABLE_BLOCK = 'public."block"';
const TABLE_MESSAGE = 'public."message"';
const TABLE_TRANSACTION = 'public."transaction"';

export class BDDBClient extends SQLClient {
    constructor(url: string) {
        super(url);
    }

    async getCurrentHeight(): Promise<number> {
        const { rows, rowCount } = await this.sql(`SELECT MAX(height) FROM ${TABLE_BLOCK}`);
        if (!rowCount) {
            throw new Error('error fetching current height');
        }
        return rows[0].max;
    }

    async getCurrentMsgHeight(): Promise<number> {
        const { rows, rowCount } = await this.sql(`SELECT MAX(height) FROM ${TABLE_MESSAGE}`);
        if (!rowCount) {
            throw new Error('error fetching current message height');
        }
        return rows[0].max;
    }

    async getBlock(height: number): Promise<Block> {
        const { rows, rowCount } = await this.sql(`SELECT * FROM ${TABLE_BLOCK} WHERE height = $1 LIMIT 1`, [
            height,
        ]);
        if (!rowCount) {
            throw new Error(`block with height ${height} not found`);
        }
        return rows[0];
    }

    async getMessages(addresses: string[], afterHeight: number): Promise<Message[]> {
        const stmnt = `SELECT * FROM ${TABLE_MESSAGE} WHERE involved_accounts_addresses && $1 AND height > $2`;
        const { rows } = await this.sql(stmnt, [this.formatArrayParam(addresses), afterHeight]);
        return rows;
    }

    async getMessagesByType(
        addresses: string[],
        type: string,
        afterHeight: number,
    ): Promise<Message[]> {
        const stmnt = `SELECT * FROM ${TABLE_MESSAGE} WHERE type = '${type}' AND involved_accounts_addresses && $1 AND height > $2`;
        const { rows } = await this.sql(stmnt, [this.formatArrayParam(addresses), afterHeight]);
        return rows;
    }

    async getAllMessagesByType(type: string, afterHeight: number): Promise<Message[]> {
        const stmnt = `SELECT * FROM ${TABLE_MESSAGE} WHERE type = '${type}' AND height > $1`;
        const { rows } = await this.sql(stmnt, [afterHeight]);
        return rows;
    }

    async getTransactions(hashes: string[], success: boolean): Promise<Transaction[]> {
        const stmnt = `SELECT hash, success, height, logs FROM ${TABLE_TRANSACTION} WHERE hash IN ${this.buildHashesArray(
            hashes,
        )} AND success = $1`;
        const { rows } = await this.sql(stmnt, [success]);
        return rows;
    }

    async getLastBlockHeightBefore(date: Date): Promise<number> {
        const stmnt = `SELECT height FROM ${TABLE_BLOCK} WHERE timestamp < $1 ORDER BY timestamp DESC LIMIT 1`;
        const { rows, rowCount } = await this.sql(stmnt, [date]);
        if (!rowCount) {
            throw new Error('no blocks found');
        }
        return rows[0].height;
    }

    private buildHashesArray(hashes: string[]): string {
        return `(${hashes.map((h) => `'${h}'`).join(',')})`;
    }
}
