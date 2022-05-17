import * as express from 'express';
import * as log4js from './log/logger';
import * as path from 'path';
import * as http from 'http';
import * as cors from 'cors';
import {Socket} from './socket/socket';
import sequelizer from './sequelize/sequelizer';
import {poolBamer} from './database/sqlPHC';
import {MssqlBroker} from './sqlbroker/sqlbroker';

const logg = log4js.default.getLogger();

class app {
    private http_port: number = +process.env.HTTP_PORT;

    constructor() {
        this.configServer();
    }


    private configServer() {
        logg.fatal('****************************** INICIO DO SERVIDOR ******************************');
        const jsonParser = express.json({limit: '50mb'});
        const urlEncodedParser = express.urlencoded({limit: '50mb', extended: false});

        const app = express();
        app.use(cors());
        app.use(jsonParser);
        const server = http.createServer(app);

        const angularPreparacaoDist = path.join(__dirname, '..', 'embalagem-angular', 'dist', 'embalagem');
        app.use('/public', express.static(path.join(__dirname, 'public')));
        app.use('/temp', express.static(path.join(__dirname, 'temp')));
        app.use(express.static(angularPreparacaoDist));
        app.use('/', urlEncodedParser, (req: express.Request, res: express.Response) => {
            res.status(200).sendFile('/', {root: angularPreparacaoDist});
        });

        // const serverApp = require('http').Server(this.app);
        server
            .listen(this.http_port, () => {
                logg.info(`Http Server porta ${this.http_port}`);
                this.initApps(server);
            })
            .on('error', (err) => {
                logg.fatal('Erro ao iniciar Servidor HTTP:', err.message);
            });
    }

    private initApps(server) {
        new Socket(server);
        this.startSequelize().catch();
        poolBamer
            .then(() => {
                logg.debug('POOL Bamer realizada com sucesso');
                new MssqlBroker();
            })
            .catch((err) => {
                logg.error(err.message);
            });
    }

    private async startSequelize() {
        const sequelizerSyncro = await sequelizer
            .sync({force: false})
            .catch((err) => {
                logg.error(err);
            });

        if (!sequelizerSyncro) {
            return;
        }

        sequelizerSyncro.authenticate()
            .then(() => {
                logg.info(`Sequelize ON na DB ${process.env.SEQUELIZE_DATABASE}`);
            })
            .catch((err) => {
                logg.error('Sequelize erro:', err);
            });
    }
}

export default app;
