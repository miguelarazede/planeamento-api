import * as Sqlssb from 'sqlssb';
import {logg} from '../log/logger';
import {CtBoentregas} from '../models/ct-boentregas';
import {timer} from 'rxjs';
import {OsProcessos} from '../models/os-processos';

export interface IComando {
    comando: string;
    payload: any;
}


export class MssqlBroker {
    configBroker = {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASS,
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        service: process.env.SB_GANTT_PLAN_SERVICE,
        queue: process.env.SB_GANTT_PLAN_QUEUE,
        contract: process.env.SB_GANTT_PLAN_CONTRACT,
    };


    constructor() {
        const brokerServiceTalker = new Sqlssb(this.configBroker);
        brokerServiceTalker.start()
            .then(() => {
                logg.info('MSSQL Broker Service ON');
                const tipoMensagem = process.env.SB_GANTT_PLAN_MESSAGE_TYPE;
                logg.info(`A escutar mensagens do tipo ${tipoMensagem}`);
                brokerServiceTalker.on(tipoMensagem, async (ctx) => {
                    const jsonMessageBody = JSON.parse(ctx.messageBody);
                    for (const jsonElement of jsonMessageBody) {
                        const elemento: IComando = jsonElement;
                        logg.info(`Broker:`, elemento.comando);
                        if (elemento.comando.localeCompare('osProcessosGanttInsert') === 0) {
                            if (elemento.payload) {
                                for (const payloadElement of elemento.payload) {
                                    logg.debug(payloadElement);
                                    await OsProcessos.inserirOrigemPHC(payloadElement)
                                        .catch(err => {
                                            logg.error(err.message);
                                        });
                                }
                            }
                            return;
                        }

                        if (elemento.comando.localeCompare('_os_processos_ganttplan_delete') === 0) {
                            if (elemento.payload) {
                                for (const payloadElement of elemento.payload) {
                                    logg.debug(payloadElement);
                                    await OsProcessos.deleteOrigemPHC(payloadElement)
                                        .catch(err => {
                                            logg.error(err.message);
                                        });
                                }
                            }
                            return;
                        }

                        if (elemento.comando.localeCompare('ct_boentregas_ganttplan_insert') === 0 && elemento.payload) {
                            if (elemento.payload) {
                                for (const payloadElement of elemento.payload) {
                                    await CtBoentregas.inserirTarefaTeamsFromPHC(payloadElement)
                                        .catch(err => {
                                            logg.error(err.message);
                                        });
                                    if (elemento.payload.length > 1) {
                                        await this.waitInterval(2000).catch();
                                    }
                                }
                            }
                            return;
                        }
                        if (elemento.comando.localeCompare('ct_boentregas_ganttplan_update') === 0 && elemento.payload) {
                            if (elemento.payload) {
                                for await (const payloadElement of elemento.payload) {
                                    await CtBoentregas.updateTarefaTeamsFromPHC(payloadElement).catch();
                                    if (elemento.payload.length > 1) {
                                        await this.waitInterval(1000).catch();
                                    }
                                }
                            }
                            return;
                        }
                        if (elemento.comando.localeCompare('ct_boentregas_ganttplan_delete') === 0 && elemento.payload) {
                            if (elemento.payload) {
                                for await (const payloadElement of elemento.payload) {
                                    await CtBoentregas.deleteTarefaTeamsFromPHC(payloadElement).catch();
                                    if (elemento.payload.length > 1) {
                                        await this.waitInterval(1000).catch();
                                    }
                                }
                            }
                            return;
                        }
                    }
                });
            })
            .catch(err => {
                logg.error('BROKER ERROR', err);
            });
    }

    private waitInterval(tempo: number) {
        logg.info(`A esperar ${tempo / 1000}s para o registo seguinte`);
        return new Promise((resolve, _reject) => {
            timer(tempo).subscribe(() => {
                resolve(true);
            });
        });
    }
}
