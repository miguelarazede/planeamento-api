import {logg} from '../log/logger';
import Axios, {AxiosRequestConfig} from 'axios';
import {Bo, IBo} from './bo';
import * as moment from 'moment';
import {GanntPlaneamento} from './gannt-planeamento';
import {poolBamer} from '../database/sqlPHC';
import {ConnectionPool} from 'mssql';

export interface ICtBoentrega {
    ct_boentregasstamp: string;
    bostamp: string;
    item: string;
    descricao: string;
    data: Date;
    dprepini: Date;
    dprepfim: Date;
    prp: string;
    idTeamsTask: string;
    usiniciais: string;
    usemail: string;
    ususername: string;
}

export interface ITarefaTeams {
    ct_boentregasstamp: string,
    prp: string;
    email: string;
    inicio: any;
    fim: any;
    titulo: string;
    descricao: string;
    tipo: string; // insert, update
    idTeamsTask: string;
    bostamp: string;
    dataLimite: Date;
}

export class CtBoentregas {
    static async inserirTarefaTeamsFromPHC(payload: any) {
        return new Promise(async (resolve, reject) => {
            const ct: ICtBoentrega = payload as ICtBoentrega;
            if (!('idTeamsTask' in ct)) {
                const erro = new Error('sem idTeamsTask property?');
                logg.error(erro.message, ct);
                reject(erro);
                return;
            }

            if (!ct.idTeamsTask) {
                ct.idTeamsTask = '';
            }
            if (ct.idTeamsTask.localeCompare('') !== 0) {
                logg.debug('Concluido: já tem idTeamsTask (ct_boentregasstamp, idTeamsTask)', ct.ct_boentregasstamp, ct.idTeamsTask);
                resolve(true);
                return;
            }

            logg.info('inserir nas tarefas Teams', ct.ct_boentregasstamp);
            const tarefa = await CtBoentregas.getDadosTarefa(ct, 'insert')
                .catch(err => {
                    reject(err);
                });

            if (!tarefa) return;
            this.insertUpdateTarefaTeams(tarefa)
                .then((ret) => {
                    resolve(ret);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    static async updateTarefaTeamsFromPHC(elemento: any) {
        return new Promise(async (resolve, reject) => {
            const ct: ICtBoentrega = elemento as ICtBoentrega;
            if (!('idTeamsTask' in ct)) {
                logg.error('sem idTeamsTask property?', ct);
                resolve(false);
                return;
            }
            if (!ct.idTeamsTask) {
                logg.debug('idTeamsTask null', ct.ct_boentregasstamp);
                resolve(false);
                return;
            }
            if (ct.idTeamsTask.localeCompare('') === 0) {
                logg.debug('O elemento não tem idTeamsTask', ct.ct_boentregasstamp);
                resolve(false);
                return;
            }
            logg.info('actualizar nas tarefas Teams (ct_boentregasstamp, idTeamsTask', ct.ct_boentregasstamp, ct.idTeamsTask);

            const tarefa = await CtBoentregas.getDadosTarefa(ct, 'update')
                .catch(err => {
                    reject(err);
                });

            if (!tarefa) return;

            this.insertUpdateTarefaTeams(tarefa)
                .then((ret) => {
                    resolve(ret);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    static deleteTarefaTeamsFromPHC(elemento: any) {
        return new Promise<any>((resolve, reject) => {
            const ct = elemento as ICtBoentrega;
            const config: AxiosRequestConfig = {
                method: 'delete',
                url: 'https://server.bamer.pt/api/delete_ctboentregas_teamstask',
                headers: {
                    Content: 'application/json',
                    'Content-Type': 'application/json',
                },
                data: {idTeamsTask: ct.idTeamsTask},
            };
            Axios(config)
                .then((resp => {
                    logg.info(ct.idTeamsTask, 'eliminado com sucesso');
                    resolve(resp);
                }))
                .catch(err => {
                    reject(err);
                });
        });
    }

    static getDadosECPorCtBoEntregasstamp(ct_boentregasstamp: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const pool = await poolBamer.catch(err => {
                reject(err);
            });
            if (!pool) {
                return;
            }
            let sqlQuery = `
                select top 1 bo.*, isnull(fref.nmfref, '') as nmfref 
                from bo
                    inner join ct_boentregas ct on bo.bostamp = ct.bostamp
                    left join fref on bo.fref = fref.fref 
                where ct.ct_boentregasstamp = @ct_boentregasstamp 
            `
            ;
            const recs = await this.getRecs(pool, ct_boentregasstamp, sqlQuery, reject);
            if (!recs) {
                return;
            }
            if (!recs.recordset) {
                reject(new Error(`${ct_boentregasstamp} não devolveu valores`));
                return;
            }
            resolve(recs.recordsets[0][0]);
        });
    }

    static getDadosPorCtBoEntregasstamp(ct_boentregasstamp: string): Promise<ICtBoentrega> {
        return new Promise<any>(async (resolve, reject) => {
            const pool = await poolBamer.catch(err => {
                reject(err);
            });
            if (!pool) {
                return;
            }
            let sqlQuery = `
                select * 
                from ct_boentregas ct 
                where ct.ct_boentregasstamp = @ct_boentregasstamp 
            `
            ;
            const recs = await this.getRecs(pool, ct_boentregasstamp, sqlQuery, reject);
            if (!recs) {
                return;
            }
            if (!recs.recordset) {
                reject(new Error(`${ct_boentregasstamp} não devolveu valores`));
                return;
            }
            resolve(recs.recordsets[0][0]);
        });
    }

    private static async getRecs(pool: ConnectionPool, ct_boentregasstamp: string, sqlQuery: string, reject: (reason?: any) => void) {
        return await pool
            .request()
            .input('ct_boentregasstamp', ct_boentregasstamp)
            .query(sqlQuery)
            .catch(err => {
                reject(err);
            });
    }

    private static async insertUpdateTarefaTeams(tarefa: ITarefaTeams) {
        return new Promise(async (resolve, reject) => {
            const config: AxiosRequestConfig = {
                method: 'post',
                url: 'https://prod-252.westeurope.logic.azure.com:443/workflows/c9de7baf68d7443ca4e8e8b6155081d8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eTnydID6QyCt5L4NpZLMY7h-rlvKIlo7JNu53cadWsM',
                headers: {
                    Content: 'application/json',
                    'Content-Type': 'application/json',
                },
                data: tarefa,
            };
            const retornoAxios = await Axios(config)
                .catch(err => {
                    logg.error('Axios', err.message);
                    reject(err);
                });
            if (retornoAxios) {
                logg.debug(retornoAxios.status, retornoAxios.statusText);
                if (tarefa.tipo.localeCompare('update') === 0) {
                    const dinicio = new Date(tarefa.inicio);
                    const dfim = new Date(tarefa.inicio);
                    if (dinicio.getUTCFullYear() === 1900 || dfim.getUTCFullYear() === 1900) {
                        logg.info('Inicio ou fim sem data definida');
                    } else {
                        await GanntPlaneamento.insertUpdateFromTarefa(tarefa)
                            .then(() => {
                                logg.info('Tarefa inserida ou actualizada no Gantt Planeamento', tarefa);
                            })
                            .catch(err => {
                                logg.error(err.message);
                            });
                    }
                }
                resolve(retornoAxios);
            }
        });
    }

    private static async getDadosTarefa(ct: ICtBoentrega, tipo: string) {
        return new Promise<ITarefaTeams>(async (resolve, reject) => {
                const dadosBo = await Bo.getDadosPorBostamp(ct.bostamp)
                    .catch(err => {
                        reject(err);
                    });
                if (!dadosBo) {
                    return;
                }
                const bo: IBo = dadosBo;
                const titulo = `EC: #${bo.obrano}\n${ct.item.trim()} - ${ct.descricao.trim()}`;
                const descricao = `Cliente: ${bo.nome2.trim()}\nDesign. Ec: ${bo.trab5.trim()}\nObra: #${bo.fref.trim()} - ${bo.nmfref.trim()}\nDt.Pretendida: ${moment(ct.data).format('DD.MM.yyyy')}`;
                const tarefa: ITarefaTeams = {
                    ct_boentregasstamp: ct.ct_boentregasstamp,
                    fim: ct.dprepfim,
                    prp: ct.usiniciais ?? '',
                    descricao,
                    email: ct.usemail ?? '',
                    inicio: ct.dprepini,
                    titulo,
                    idTeamsTask: ct.idTeamsTask,
                    tipo,
                    bostamp: ct.bostamp,
                    dataLimite: ct.data,
                };
                resolve(tarefa);
            }
        );
    }
}
