import * as sql from 'mssql';
import { mssqlConfig } from './mssqlConfig';
import { sqlLogging } from '../index';

export class Database {
    private pool: sql.ConnectionPool | null = null;

    async connect(): Promise<sql.ConnectionPool> {
        if (!this.pool) {
            this.pool = await sql.connect(mssqlConfig);
            if (sqlLogging) {
                console.log('✅ DB CONNECTION');
            }
        }
        return this.pool;
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.close();
            this.pool = null;
            if (sqlLogging) {
                console.log('❌ DB CONNECTION');
            }
        }
    }

    async request(): Promise<sql.Request> {
        const pool = await this.connect();
        return (pool ? await this.connect() : pool).request();
    }

    async query<T = any>(sqlQuery: string, params?: { [key: string]: any }): Promise<sql.IResult<T>> {
        const pool = await this.connect();
        const request = (pool ? await this.connect() : pool).request();

        if (params !== undefined) {
            Object.entries(params).forEach(([key, value]) => {
                request.input(key, value);
            });
        }

        if (sqlLogging) {
            console.log('🔎 Executing Query:', sqlQuery, params ? params : '');
        }

        try {
            const result = await request.query<T>(sqlQuery);
            if (sqlLogging) {
                console.log('✅ Query Successful:', result.rowsAffected, 'rows affected');
                if (result.recordset) {
                    console.log(result.recordset);
                }
            }
            return result;
        } catch (error) {
            if (sqlLogging) {
                console.error('❌ Query Failed:', error);
            }
            throw error;
        }
    }

    async transaction<T>(callback: (transaction: sql.Transaction) => Promise<T>): Promise<T> {
        const pool = await this.connect();
        const transaction = pool.transaction();

        await transaction.begin();
        if (sqlLogging) {
            console.log('✅ BEGIN');
        }

        try {
            const result = await callback(transaction);
            await transaction.commit();
            if (sqlLogging) {
                console.log('✅ COMMIT');
            }
            return result;
        } catch (error) {
            await transaction.rollback();
            if (sqlLogging) {
                console.error('❌ ROLLBACK', error);
            }
            throw error;
        } finally {
            await this.close();
        }
    }
}

export const db = new Database();
