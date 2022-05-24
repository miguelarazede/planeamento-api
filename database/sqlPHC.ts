import * as mssqlLib from 'mssql';
import {logg} from '../log/logger';

const dotenv = process.env;
const porta = dotenv.SQL_PORT ? +dotenv.SQL_PORT : 1433;
const config = {
    user: dotenv.SQL_USER,
    password: dotenv.SQL_PASS,
    server: dotenv.SQL_SERVER,
    database: dotenv.SQL_DATABASE,
    port: porta,
    pool: {
        max: 50,
        min: 10,
        idleTimeoutMillis: 500,
        // retryDelay: 10 * 1000,
        log: (msg: string) => {
            logg.debug('MSSQL', msg)
        }
    },
    options: {
        instanceName: dotenv.SQL_INSTANCE,
        enableArithAbort: true,
        encrypt: false,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
} as mssqlLib.config;

export const poolBamer = new mssqlLib.ConnectionPool(config, (err) => {
    if (err) {
        logg.error(err.message, config);
    }
})
    .connect()
    .then((pool) => {
        logg.info('Ligação ao MSSQL PHC efectuada com sucesso');
        return pool;
    })
    .catch((err) => {
        logg.error('Ligação a MSSQL PHC falhou: ', err);
        process.exit(1);
    });

// export default poolPromisePHC;
