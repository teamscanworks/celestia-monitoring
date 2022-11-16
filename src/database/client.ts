import { Pool } from 'pg';

export abstract class SQLClient {
    private client: Pool; // When/where should this be closed?

    constructor(connectionString: string) {
        this.client = new Pool({
            connectionString,
            max: 2,
            ssl: { rejectUnauthorized: false },
        });
        this.client.connect();
    }

    protected formatArrayParam(arr: string[]): string {
        return JSON.stringify(arr).replace('[', '{').replace(']', '}');
    }

    protected async sql(sql: string, params: any = []): Promise<{ rows: any[]; rowCount: number }> {
        const result = await this.client.query(sql, params);
        return {
            rows: result.rows,
            rowCount: result.rowCount,
        };
    }
}