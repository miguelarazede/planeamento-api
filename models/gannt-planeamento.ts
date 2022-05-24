import {Socket} from 'socket.io';
import {ITarefaTeams} from './ct-boentregas';
import {GanttPlaneamentoModel, IGanttPlaneamento} from './sequelize/gantt-planeamento-model';
import {logg} from '../log/logger';
import {IOsProcesso} from './os-processos';
import {Funcoes} from '../shared/funcoes';

export class GanntPlaneamento {
    static socket(io: Socket, socket: Socket) {

    }

    static async insertUpdateFromTarefa(tarefa: ITarefaTeams) {
        const ganttPlaneamento: IGanttPlaneamento = {
            dataLimite: tarefa.dataLimite,
            oristamp: tarefa.ct_boentregasstamp,
            createdAt: null,
            updatedAt: null,
            stamp: null,
            end: tarefa.fim,
            id: 1,
            bostamp: tarefa.bostamp,
            processo: 'preparação',
            progress: 0,
            resourceEmail: '',
            resourceName: '',
            start: tarefa.inicio,
            tipo: 4,
            title: tarefa.titulo,
            parentID: 0,
            fechada: false
        };
        delete ganttPlaneamento.createdAt;
        delete ganttPlaneamento.updatedAt;
        delete ganttPlaneamento.stamp;

        const defaults = ganttPlaneamento as any;
        return new Promise<[GanttPlaneamentoModel, boolean]>((resolve, reject) => {
            GanttPlaneamentoModel.findOrCreate({
                defaults,
                where: {
                    oristamp: tarefa.ct_boentregasstamp,
                },
            }).then((ret) => {
                if (!ret[1]) {
                    const ganntt = ret[0];
                    ganntt.update(defaults)
                        .then((ret2) => {
                            logg.info('Gannt actualizado');
                            resolve([ret2, ret[1]]);
                        })
                        .catch(err => {
                            logg.error(err.message);
                        });
                } else {
                    resolve(ret);
                }
            }).catch((err) => {
                logg.error(defaults);
                reject(err);
            });
        });
    }

    static async inserirUpdateGanttFromOsProcessos(osProcessos: IOsProcesso[]) {
        return new Promise(async (resolve, reject) => {
            const recs: [GanttPlaneamentoModel, boolean][] = [];

            // EC
            const retEC = await this.insertUpdateGanttEC(osProcessos[0])
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retEC) {
                recs.push(retEC);
                logg.info(`EC: ${retEC.length / 2}`);
            }

            // PLANEAMENTO
            const retPlan = await this.insertUpdateGanttPlaneamento(osProcessos[0])
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retPlan) {
                recs.push(retPlan);
                logg.info(`Planeamento: ${retPlan.length / 2}`);

            }

            // OS
            const retOS = await this.insertUpdateGanttOS(osProcessos[0])
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retOS) {
                recs.push(retOS);
                logg.info(`OS: ${retOS.length / 2}`);
            }

            // PROCESSOS
            const retProcessos = await this.insertUpdateGanttProcessosDaOS(osProcessos)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retProcessos) {
                recs.push(...retProcessos);
                logg.info(`Processos: ${retProcessos.length}`);
            }

            // OS
            const retExpedicao = await this.insertUpdateGanttExpedicao(osProcessos[0])
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retExpedicao) {
                recs.push(retExpedicao);
                logg.info(`Expedicao: ${retExpedicao.length / 2}`);
            }
            resolve(recs);
        });
    }

    private static insertUpdateGanttEC(iOsProcesso: IOsProcesso): Promise<[GanttPlaneamentoModel, boolean]> {
        return new Promise(async (resolve, reject) => {
            const ec = iOsProcesso.ec;
            let gantt: IGanttPlaneamento = {
                bostamp: ec.bostamp,
                processo: '',
                start: new Date(),
                end: new Date(),
                dataLimite: iOsProcesso.ct.data,
                oristamp: ec.bostamp,
                id: 10,
                title: `EC #${ec.obrano}; Obra: ${ec.fref.trim()} - ${ec.nmfref.trim()}`,
                parentID: 0,
                resourceEmail: '',
                progress: 0,
                tipo: 10,
                resourceName: '',
                fechada: false,
            };
            const retSeq = await GanntPlaneamento.inserirRegistoGantt(gantt)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retSeq) {
                resolve(retSeq);
            }
        });
    }

    private static insertUpdateGanttPlaneamento(iOsProcesso: IOsProcesso): Promise<[GanttPlaneamentoModel, boolean]> {
        return new Promise(async (resolve, reject) => {
            const ct = iOsProcesso.ct;
            let gantt: IGanttPlaneamento = {
                bostamp: iOsProcesso.ec.bostamp,
                processo: '',
                start: new Date(),
                end: new Date(),
                dataLimite: ct.data,
                oristamp: ct.ct_boentregasstamp,
                id: 20,
                title: ct.item.trim().concat(' - ', ct.descricao.trim()),
                parentID: 10,
                resourceEmail: iOsProcesso.email,
                progress: 0,
                tipo: 20,
                resourceName: iOsProcesso.email,
                fechada: false,
            };
            const retSeq = await GanntPlaneamento.inserirRegistoGantt(gantt)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retSeq) {
                resolve(retSeq);
            }
        });
    }

    private static insertUpdateGanttOS(iOsProcesso: IOsProcesso): Promise<[GanttPlaneamentoModel, boolean]> {
        return new Promise(async (resolve, reject) => {
            let gantt: IGanttPlaneamento = {
                bostamp: iOsProcesso.ec.bostamp,
                processo: '',
                start: new Date(),
                end: new Date(),
                dataLimite: iOsProcesso.ct.data,
                oristamp: iOsProcesso.os.bostamp,
                id: 50,
                title: `OS #${iOsProcesso.os.obrano}`,
                parentID: 20,
                resourceEmail: '',
                progress: 0,
                tipo: 50,
                resourceName: '',
                fechada: false,
            };
            const retSeq = await GanntPlaneamento.inserirRegistoGantt(gantt)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retSeq) {
                resolve(retSeq);
            }
        });
    }

    private static insertUpdateGanttProcessosDaOS(iOsProcessos: IOsProcesso[]): Promise<[GanttPlaneamentoModel, boolean][]> {
        return new Promise(async (resolve, reject) => {
            const recs: [GanttPlaneamentoModel, boolean][] = [];
            const del = await GanttPlaneamentoModel.destroy({
                where: {
                    bostamp: iOsProcessos[0].ec.bostamp,
                    tipo: 60,
                }
            }).catch((err) => {
                logg.error(err.message);
                reject(err);
            });
            if (!del) {
                return;
            }

            for await (const iOsProcesso of iOsProcessos) {
                const ct = iOsProcesso.ct;
                let gantt: IGanttPlaneamento = {
                    bostamp: iOsProcesso.ec.bostamp,
                    processo: iOsProcesso.gamaOpLin.processo,
                    start: iOsProcesso.inicio,
                    end: iOsProcesso.fim,
                    dataLimite: ct.data,
                    oristamp: iOsProcesso.stamp,
                    id: iOsProcesso.ordem,
                    title: `${Funcoes.getFriendlyEstado(iOsProcesso.gamaOpLin.processo)}`,
                    parentID: 50,
                    resourceEmail: iOsProcesso.email,
                    progress: 0,
                    tipo: 60,
                    resourceName: iOsProcesso.email,
                    fechada: false,
                };
                const retSeq = await GanntPlaneamento.inserirRegistoGantt(gantt)
                    .catch(err => {
                        logg.error(err.message);
                        reject(err);
                    });
                if (retSeq) {
                    recs.push(retSeq);
                }
            }
            resolve(recs);
        });
    }

    private static insertUpdateGanttExpedicao(iOsProcesso: IOsProcesso): Promise<[GanttPlaneamentoModel, boolean]> {
        return new Promise(async (resolve, reject) => {
            let gantt: IGanttPlaneamento = {
                bostamp: iOsProcesso.ec.bostamp,
                processo: '',
                start: iOsProcesso.expedicao.datafinal,
                end: iOsProcesso.expedicao.datafinal,
                dataLimite: iOsProcesso.ct.data,
                oristamp: iOsProcesso.expedicao.bostamp,
                id: 70,
                title: `Expedição #${iOsProcesso.expedicao.obrano}`,
                parentID: 20,
                resourceEmail: '',
                progress: 0,
                tipo: 50,
                resourceName: '',
                fechada: false,
            };
            const retSeq = await GanntPlaneamento.inserirRegistoGantt(gantt)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retSeq) {
                resolve(retSeq);
            }
        });
    }

    private static inserirRegistoGantt(gantt: IGanttPlaneamento): Promise<[GanttPlaneamentoModel, boolean]> {
        return new Promise(async (resolve, reject) => {
            const ganttCt = await GanttPlaneamentoModel.findOrCreate({
                defaults: gantt as any,
                where: {
                    oristamp: gantt.oristamp
                }
            })
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (!ganttCt) {
                return;
            }
            if (!ganttCt[1]) {
                const registo: GanttPlaneamentoModel = ganttCt[0];
                await registo.update(gantt)
                    .catch(err => {
                        logg.error(err.message);
                        reject(err);
                    });
            }
            resolve(ganttCt);
        });
    }
}
