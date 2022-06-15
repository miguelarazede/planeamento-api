import * as mssqlLib from 'mssql';
import {logg} from '../log/logger';

const dotenv = process.env;
const porta = dotenv.DTI_SQL_PORT ? +dotenv.SQL_PORT : 1433;
const config = {
    user: dotenv.DTI_SQL_USER,
    password: dotenv.DTI_SQL_PASS,
    server: dotenv.DTI_SQL_SERVER,
    database: dotenv.DTI_SQL_DATABASE,
    port: porta,
    pool: {
        max: 50,
        min: 10,
        idleTimeoutMillis: 500,
    },
    options: {
        instanceName: dotenv.DTI_SQL_INSTANCE,
        enableArithAbort: true,
        encrypt: false,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
} as mssqlLib.config;

export const poolDTI = new mssqlLib.ConnectionPool(config, (err) => {
    if (err) {
        logg.error(err.message, config);
    }
})
    .connect()
    .then((pool) => {
        logg.info('Ligação ao MSSQL DTI efectuada com sucesso');
        return pool;
    })
    .catch((err) => {
        logg.error('Ligação a MSSQL DTI falhou: ', err);
        process.exit(1);
    });

// export default poolPromisePHC;
