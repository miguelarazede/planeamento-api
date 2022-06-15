import {ITarefaTeams} from './ct-boentregas';
import {GanttPlaneamentoModel, IGanttPlaneamento} from './sequelize/gantt-planeamento-model';
import {logg} from '../log/logger';
import {IOsProcesso} from './os-processos';
import {Funcoes} from '../shared/funcoes';

export class GanntPlaneamento {
    static TIPO_EC = 10;
    static TIPO_ITEM_PLANEAMENTO = 20;
    static TIPO_PREPARACAO = 30;
    static TIPO_APROVISIONAMENTO = 40;
    static TIPO_OS = 50;
    static TIPO_PROCESSOS_OS = 60;
    static TIPO_EXPEDICAO = 70;

    static async insertUpdateFromTarefa(tarefa: ITarefaTeams) {
        const ganttPlaneamento: IGanttPlaneamento = {
            dataLimite: tarefa.dataLimite,
            oristamp: tarefa.ct_boentregasstamp,
            relstamp: '',
            createdAt: undefined,
            updatedAt: undefined,
            stamp: undefined,
            end: tarefa.fim,
            id: 1,
            bostamp: tarefa.bostamp,
            obranoec: 0,
            processo: 'preparação',
            progress: 0,
            resourceEmail: '',
            resourceName: '',
            start: tarefa.inicio,
            tipo: 4,
            title: tarefa.titulo,
            parentID: 0,
            fechada: false,
            isDataDefinida: false,
            idTeamsTask: tarefa.idTeamsTask
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
            const retProcessos = await this.insertGanttProcessosDaOS(osProcessos)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retProcessos) {
                recs.push(...retProcessos);
                logg.info(`Processos: ${retProcessos.length}`);
            }

            // EXPEDIÇÃO
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
                obranoec: ec.obrano,
                processo: '',
                start: new Date(),
                end: new Date(),
                dataLimite: iOsProcesso.ct.data,
                oristamp: ec.bostamp,
                relstamp: '',
                id: 10,
                title: `EC #${ec.obrano}; Obra: ${ec.fref.trim()} - ${ec.nmfref.trim()}`,
                parentID: 0,
                resourceEmail: '',
                progress: 0,
                tipo: this.TIPO_EC,
                resourceName: '',
                fechada: false,
                isDataDefinida: GanntPlaneamento.getIsDataDefinida(iOsProcesso),
                idTeamsTask: '',
            };
            const retSeq = await GanntPlaneamento.inserirGanttSQL(gantt)
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
                obranoec: iOsProcesso.ec.obrano,
                processo: '',
                start: new Date(),
                end: new Date(),
                dataLimite: ct.data,
                oristamp: ct.ct_boentregasstamp,
                relstamp: ct.bostamp,
                id: 20,
                title: ct.item.trim().concat(' - ', ct.descricao.trim()),
                parentID: 10,
                resourceEmail: iOsProcesso.email,
                progress: 0,
                tipo: this.TIPO_ITEM_PLANEAMENTO,
                resourceName: iOsProcesso.email,
                fechada: false,
                isDataDefinida: GanntPlaneamento.getIsDataDefinida(iOsProcesso),
                idTeamsTask: '',
            };
            const retSeq = await GanntPlaneamento.inserirGanttSQL(gantt)
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
                obranoec: iOsProcesso.ec.obrano,
                processo: '',
                start: new Date(),
                end: new Date(),
                dataLimite: iOsProcesso.ct.data,
                oristamp: iOsProcesso.os.bostamp,
                relstamp: iOsProcesso.ct_boentregasstamp,
                id: 50,
                title: `OS #${iOsProcesso.os.obrano}`,
                parentID: 20,
                resourceEmail: '',
                progress: 0,
                tipo: this.TIPO_OS,
                resourceName: '',
                fechada: false,
                isDataDefinida: GanntPlaneamento.getIsDataDefinida(iOsProcesso),
                idTeamsTask: '',
            };
            const retSeq = await GanntPlaneamento.inserirGanttSQL(gantt)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retSeq) {
                resolve(retSeq);
            }
        });
    }

    private static insertGanttProcessosDaOS(iOsProcessos: IOsProcesso[]): Promise<[GanttPlaneamentoModel, boolean][]> {
        return new Promise(async (resolve, reject) => {
            const recs: [GanttPlaneamentoModel, boolean][] = [];
            await GanttPlaneamentoModel.destroy({
                where: {
                    relstamp: iOsProcessos[0].os.bostamp,
                    tipo: this.TIPO_PROCESSOS_OS,
                }
            }).catch((err) => {
                logg.error(err.message);
                reject(err);
            });

            for await (const iOsProcesso of iOsProcessos) {
                const ct = iOsProcesso.ct;
                let gantt: IGanttPlaneamento = {
                    bostamp: iOsProcesso.ec.bostamp,
                    obranoec: iOsProcesso.ec.obrano,
                    processo: iOsProcesso.gamaOpLin.processo,
                    start: iOsProcesso.inicio,
                    end: iOsProcesso.fim,
                    dataLimite: ct.data,
                    oristamp: iOsProcesso.stamp,
                    relstamp: iOsProcesso.os.bostamp,
                    id: iOsProcesso.ordem,
                    title: `${Funcoes.getFriendlyEstado(iOsProcesso.gamaOpLin.processo).toLowerCase()}`,
                    parentID: 50,
                    resourceEmail: iOsProcesso.email,
                    progress: 0,
                    tipo: this.TIPO_PROCESSOS_OS,
                    resourceName: iOsProcesso.email,
                    fechada: false,
                    isDataDefinida: GanntPlaneamento.getIsDataDefinida(iOsProcesso),
                    idTeamsTask: '',
                };
                const retSeq = await GanntPlaneamento.inserirGanttSQL(gantt)
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
            let dataInicio;
            let dataFim;
            if (GanntPlaneamento.getIsDataDefinida(iOsProcesso)) {
                dataInicio = new Date(iOsProcesso.expedicao.datafinal);
                dataFim = new Date(iOsProcesso.expedicao.datafinal);
            } else {
                dataInicio = new Date(iOsProcesso.ct.data);
                dataFim = new Date(iOsProcesso.ct.data);
            }
            dataInicio.setHours(2);
            dataFim.setHours(22);
            let gantt: IGanttPlaneamento = {
                bostamp: iOsProcesso.ec.bostamp,
                obranoec: iOsProcesso.ec.obrano,
                processo: '',
                start: dataInicio,
                end: dataFim,
                dataLimite: iOsProcesso.ct.data,
                oristamp: iOsProcesso.expedicao.bostamp,
                relstamp: iOsProcesso.ct_boentregasstamp,
                id: 70,
                title: `Expedição #${iOsProcesso.expedicao.obrano}`,
                parentID: 20,
                resourceEmail: '',
                progress: 0,
                tipo: this.TIPO_EXPEDICAO,
                resourceName: '',
                fechada: false,
                isDataDefinida: GanntPlaneamento.getIsDataDefinida(iOsProcesso),
                idTeamsTask: '',
            };
            const retSeq = await GanntPlaneamento.inserirGanttSQL(gantt)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (retSeq) {
                resolve(retSeq);
            }
        });
    }

    private static inserirGanttSQL(gantt: IGanttPlaneamento): Promise<[GanttPlaneamentoModel, boolean]> {
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

    private static getIsDataDefinida(iOsProcesso: IOsProcesso) {
        const data = new Date(iOsProcesso.expedicao.datafinal);
        return data.getUTCFullYear() > 1900;
    }
}
