import { config } from 'dotenv';

config();

export const mssqlConfig = {
    server: 'localhost', // || process.env.MSSQL_HOST || "EMPTY",
    port: parseInt(process.env.MSSQL_PORT || '0', 10),
    database: process.env.MSSQL_DATABASE || 'EMPTY',
    user: process.env.MSSQL_USER || 'EMPTY',
    password: process.env.MSSQL_PASSWORD || 'EMPTY',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true, // change to true for local dev / self-signed certs
    },
};
const { server, port, database, user, password, options } = mssqlConfig;

export const connectionString =
    `Server=${server},${port};Database=${database};` +
    `User Id=${user};Password=${password};Encrypt=${options.encrypt ? 'true' : 'false'};` +
    `TrustServerCertificate=${options.trustServerCertificate ? 'true' : 'false'}`;
