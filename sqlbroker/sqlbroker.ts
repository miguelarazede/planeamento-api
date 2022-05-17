import * as Sqlssb from 'sqlssb';
import * as log4js from '../log/logger';

const logg = log4js.default.getLogger('sqlPHC');

interface IComando {
    comando: string;
    payload: any;
}


export class MssqlBroker {
    configBroker = {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DB,
        service: process.env.SB_PREPARACAO_SERVICE,
        queue: process.env.SB_PREPARACAO_QUEUE,
        contract: process.env.SB_PREPARACAO_CONTRACT,
    };


    constructor() {
        const brokerServiceTalker = new Sqlssb(this.configBroker);
        brokerServiceTalker.start()
            .then(() => {
                logg.info('MSSQL Broker Service iniciado');
                const tipoMensagem = process.env.SB_PREPARACAO_MESSAGE_TYPE;
                logg.info(`A escutar mensagens do tipo ${tipoMensagem}`);
                brokerServiceTalker.on(tipoMensagem, (ctx) => {
                    const jsonMessageBody = JSON.parse(ctx.messageBody);
                    for (const jsonElement of jsonMessageBody) {
                        const elemento: IComando = jsonElement;
                        logg.info(`Broker comando: ${elemento.comando}`);
                        if (elemento.comando.localeCompare('deleteTarefa') === 0) {
                        }
                    }
                });
            }).catch(err => {
            logg.error('BROKER ERROR', err);
        });
    }
}
