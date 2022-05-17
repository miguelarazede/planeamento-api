import {Sequelize} from 'sequelize';

const dotenv = process.env;

// Override timezone formatting
// DataTypes.DATE.prototype._stringify = function (date, options) {
//     date = this._applyTimezone(date, options);
//     return date.format('YYYY-MM-DD HH:mm:ss.SSS');
// }.bind(DataTypes.DATE.prototype);

const sequelizer = new Sequelize(
    dotenv.SEQUELIZE_DATABASE ? dotenv.SEQUELIZE_DATABASE : '',
    dotenv.SEQUELIZE_USER ? dotenv.SEQUELIZE_USER : '',
    dotenv.SEQUELIZE_PASS,
    {
        host: dotenv.SEQUELIZE_SERVER,
        port: dotenv.SEQUELIZE_PORT ? +dotenv.SEQUELIZE_PORT : 1433,

        dialect: 'mssql',
        dialectOptions: {
            options: {
                trustServerCertificate: false,
                instanceName: dotenv.SEQUELIZE_INSTANCE,
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

export default sequelizer;
