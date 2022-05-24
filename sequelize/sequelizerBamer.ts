import {Sequelize} from 'sequelize';

const dotenv = process.env;

// Override timezone formatting
// DataTypes.DATE.prototype._stringify = function (date, options) {
//     date = this._applyTimezone(date, options);
//     return date.format('YYYY-MM-DD HH:mm:ss.SSS');
// }.bind(DataTypes.DATE.prototype);

const sequelizerBamer = new Sequelize(
    dotenv.SQL_DATABASE,
    dotenv.SQL_USER,
    dotenv.SQL_PASS,
    {
        host: dotenv.SQL_SERVER,
        port: +dotenv.SQL_PORT,

        dialect: 'mssql',
        dialectOptions: {
            options: {
                trustServerCertificate: false,
                instanceName: dotenv.SQL_INSTANCE,
                encrypt: false,
                enableArithAbort: true,
            },
            // useUTC: true, // for reading from database
        },
        // timezone: 'Europe/Lisbon',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        logging: false,
    }
);

export default sequelizerBamer;
