import { db } from './databaseClient';

export async function dropTableIfExist(tableName: String) {
    if (await checkTableExists(tableName)) {
        return await db.query(`DROP TABLE ${tableName}`);
    }
}

export async function checkTableExists(tableName: String): Promise<boolean> {
    const result = await db.query(`
              SELECT CASE 
                WHEN OBJECT_ID('${tableName}', 'U') IS NOT NULL 
                THEN CAST(1 AS BIT) 
                ELSE CAST(0 AS BIT) 
                END AS TableExists;
    `);
    return result.recordset[0].TableExists;
}
