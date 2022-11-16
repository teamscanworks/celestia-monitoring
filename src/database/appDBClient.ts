import { AlertEvent } from '../alert/model/alert-event';
import { SQLClient } from './client';
import { EventEvent } from '../range-sdk/event';
import { AlertRule } from '../alert/model/alert-rule';

const TABLE_ALERT_RULE = 'public."AlertRule"';
const TABLE_ALERT_EVENT = 'public."AlertEvent"';
const TABLE_ALERT_RULE_OFFSET = 'public."AlertRuleOffset"';
const TABLE_EVENT_EVENT = 'public."EventEvent"';
const TABLE_EVENT_RULE = 'public."EventRule"';
const TABLE_WALLET = 'public."Wallet"';
const TABLE_CONTRACT = 'public."Contract"';
const TABLE_DESTINATION = 'public."Destination"';
const TABLE_DESTINATION_TYPE = 'public."DestinationType"';

export class AppDBClient extends SQLClient {
    constructor() {
        super(process.env.APPDB_DATABASE_URL!);
    }

    async getRules(): Promise<AlertRule[]> {
        const { rows } = await this.sql(`SELECT * FROM ${TABLE_ALERT_RULE} WHERE enabled`);
        return rows;
    }

    async getAddressesForTags(tags: string[]): Promise<string[]> {
        const walletAddresses = await this.getWalletAddressesForTags(tags);
        const contractAddresses = await this.getContractAddressesForTags(tags);
        return new Array(...new Set([...walletAddresses, ...contractAddresses]));
    }

    private async getWalletAddressesForTags(tags: string[]): Promise<string[]> {
        const stmnt = `SELECT address FROM ${TABLE_WALLET} WHERE tags && $1`;
        const { rows } = await this.sql(stmnt, [this.formatArrayParam(tags)]);
        return rows.map((a) => a.address);
    }

    private async getContractAddressesForTags(tags: string[]): Promise<string[]> {
        const stmnt = `SELECT address FROM ${TABLE_CONTRACT} WHERE tags && $1`;
        const { rows } = await this.sql(stmnt, [this.formatArrayParam(tags)]);
        return rows.map((a) => a.address);
    }

    async saveAlertEvents(events: AlertEvent[]) {
        if (!events.length) {
            return;
        }
        const stmnt = `INSERT INTO ${TABLE_ALERT_EVENT}("id", "alertRuleId", "txHash", "blockNumber", "network", "addressesInvolved", "details", "time") VALUES ($1, $2, $3, $4, $5, $6, $7, current_timestamp)`;
        await Promise.all(
            events.map((event) =>
                this.sql(stmnt, [
                    event.id,
                    event.ruleId,
                    event.txHash,
                    event.blockNumber,
                    event.network,
                    event.addressesInvolved,
                    JSON.stringify(event.details),
                ]),
            ),
        );
    }

    async saveEventEvents(events: EventEvent[]) {
        if (!events.length) {
            return;
        }
        const stmnt = `INSERT INTO ${TABLE_EVENT_EVENT} ("id", "severity", "eventName", "eventPrettyName", "details", "network", "date", "blockNumber", "txHash", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, current_timestamp)`;
        await Promise.all(
            events.map((event) =>
                this.sql(stmnt, [
                    event.id,
                    event.severity,
                    event.eventName,
                    event.eventPrettyName,
                    JSON.stringify(event.details),
                    event.network,
                    event.date,
                    event.blockNumber,
                    event.txHash,
                ]),
            ),
        );
    }

    async getRuleOffset(ruleId: string): Promise<number | null> {
        const stmnt = `SELECT * FROM ${TABLE_ALERT_RULE_OFFSET} WHERE "alertRuleId" = $1 LIMIT 1`;
        const { rowCount, rows } = await this.sql(stmnt, [ruleId]);
        if (rowCount < 1) {
            return null;
        }
        return rows[0].offset;
    }

    async getEventRuleOffset(eventName: string, network: string): Promise<number | null> {
        const stmnt = `SELECT * FROM ${TABLE_EVENT_RULE} WHERE "eventName" = $1 AND "network" = $2 LIMIT 1`;
        const { rowCount, rows } = await this.sql(stmnt, [eventName, network]);
        if (rowCount < 1) {
            return null;
        }
        return rows[0].offset;
    }

    async setRuleOffset(ruleId: string, offset: number): Promise<void> {
        const stmnt = `INSERT INTO ${TABLE_ALERT_RULE_OFFSET}("alertRuleId", "offset") VALUES ($1, $2) ON CONFLICT ("alertRuleId") DO UPDATE SET "offset" = $2`;
        await this.sql(stmnt, [ruleId, offset]);
    }

    async setEventRuleOffset(eventName: string, network: string, offset: number): Promise<void> {
        const stmnt = `INSERT INTO ${TABLE_EVENT_RULE} ("eventName", "network", "offset") VALUES ($1, $2, $3) ON CONFLICT ("eventName", "network") DO UPDATE SET "offset" = $3`;
        await this.sql(stmnt, [eventName, network, offset]);
    }

    async resetRulesOffsets(offset: number): Promise<void> {
        const stmnt = `UPDATE ${TABLE_ALERT_RULE_OFFSET} SET "offset" = $1`;
        await this.sql(stmnt, [offset]);
    }

    async getAlertRuleType(alertRuleId: string): Promise<string> {
        const { rows, rowCount } = await this.sql(
            `SELECT "ruleType" FROM ${TABLE_ALERT_RULE} WHERE id = $1`,
            [alertRuleId],
        );
        if (rowCount < 1) {
            return '';
        }
        return rows[0].ruleType;
    }
}
