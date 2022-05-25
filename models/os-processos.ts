import {logg} from '../log/logger';
import {Bo, IBo} from './bo';
import {CtBoentregas, ICtBoentrega} from './ct-boentregas';
import {GamaOpCabModel, IGamaOpCab} from './sequelize/gama-op-cab-model';
import {IGamaOpLin} from './sequelize/gamas-op-lin-model';
import {GamaOpLin} from './gamas-op-lin';
import {GanntPlaneamento} from './gannt-planeamento';
import {OSProcessosModel} from './sequelize/os-processos';

export interface IOsProcesso {
    stamp: string;
    bostamp: string;
    tabela1: string;
    tabela2: string;
    ordem: number;
    planeado: boolean;
    inicio: Date;
    fim: Date;
    gamacabstamp: string;
    gamalinstamp: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    isHistory: boolean;
    origem: string;
    usiniciais: string;
    usemail: string;
    ususername: string;
    ct_boentregasstamp: string;
    ec: IBo;
    os: IBo;
    ct: ICtBoentrega;
    gamaOpCab: IGamaOpCab;
    gamaOpLin: IGamaOpLin;
    expedicao: IBo;
}

export class OsProcessos {
    static inserirOrigemPHC(payload: IOsProcesso): Promise<IOsProcesso[]> {
        return new Promise(async (resolve, reject) => {
            const osProcessos = await this.getDadosProcesso(payload.bostamp)
                .catch(err => {
                    logg.error(err.message);
                    reject(err);
                });
            if (!osProcessos) {
                return;
            }
            GanntPlaneamento.inserirUpdateGanttFromOsProcessos(osProcessos)
                .catch();
            resolve(osProcessos);
        });
    }

    static deleteOrigemPHC(_payload: IOsProcesso): Promise<IOsProcesso[] | void> {
        return new Promise(async (resolve, _reject) => {
            // const osProcessos = await OsProcessos.getDadosProcesso(payload.bostamp)
            //     .catch(err => {
            //         logg.error(err.message);
            //         reject(err);
            //     });
            // if (!osProcessos) {
            //     return;
            // }
            // resolve(osProcessos);
            resolve();
        });
    }

    static async getDadosProcesso(bostamp: string): Promise<IOsProcesso[]> {
        return new Promise(async (resolve, reject) => {
            // let ficheiro = path.join(process.cwd(), 'query', 'os-gama-processos.sql');
            // const sqlText = await Funcoes.getConteudoFicheiro(ficheiro)
            //     .catch(err => {
            //         logg.error(err.message);
            //         reject(err);
            //     });
            // if (!sqlText) {
            //     logg.warn('sqlText undefined');
            //     return;
            // }
            //
            // const pool = await poolBamer.catch(err => {
            //     logg.error(err.message);
            //     reject(err);
            // });
            // if (!pool) {
            //     logg.warn('pool undefined');
            //     return;
            // }
            //
            // const recordsetsOsProcessos = await pool
            //     .request()
            //     .input('bostamp', bostamp)
            //     .query(sqlText)
            //     .catch(err => {
            //         logg.error(err.message);
            //         reject(err);
            //     });
            // if (!recordsetsOsProcessos) {
            //     logg.warn('recordsetsOsProcessos undefined');
            //     return;
            // }
            //
            // const osProcessos = recordsetsOsProcessos.recordset as IOsProcesso[];

            const sqlz_os_processos = await OSProcessosModel.findAll({
                where: {
                    isHistory: false,
                    bostamp
                },
                order: ['ordem']
            }).catch((err: Error) => {
                logg.error(err.message);
                reject(err);
            });
            if(!sqlz_os_processos) {
                return;
            }

            const osProcessos = sqlz_os_processos as any;


            // DADOS DA OS
            const dadosOS: IBo | void = await Bo.getDadosPorBostamp(bostamp)
                .catch(err => {
                    reject(err);
                });
            if (!dadosOS) {
                logg.warn('dadosEC undefined');
                return;
            }

            for (const osProcesso of osProcessos) {
                osProcesso.os = dadosOS;
            }

            // DADOS DA EC
            const dadosEC: IBo | void = await CtBoentregas.getDadosECPorCtBoEntregasstamp(osProcessos[0].ct_boentregasstamp)
                .catch(err => {
                    reject(err);
                });
            if (!dadosEC) {
                logg.warn('dadosEC undefined');
                return;
            }

            for (const osProcesso of osProcessos) {
                osProcesso.ec = dadosEC;
            }

            // DADOS DA CT_BOENTREGAS
            const dadosCT: ICtBoentrega | void = await CtBoentregas.getDadosPorCtBoEntregasstamp(osProcessos[0].ct_boentregasstamp)
                .catch(err => {
                    reject(err);
                });
            if (!dadosCT) {
                logg.warn('dadosCT undefined');
                return;
            }

            for (const osProcesso of osProcessos) {
                osProcesso.ct = dadosCT;
            }

            // DADOS GAMAOPLIN
            for await (const osProcesso of osProcessos) {
                const dadosGamaLin = await GamaOpLin.getDados(osProcesso.gamalinstamp);
                if (dadosGamaLin) {
                    osProcesso.gamaOpLin = dadosGamaLin.get();
                    const gamaOpCabModel = dadosGamaLin.get('GamaOpCabModel') as GamaOpCabModel;
                    osProcesso.gamaOpCab = gamaOpCabModel.get();
                }
            }

            // DADOS DE EXPEDIÇÃO
            const dadosExpedicao: IBo | void = await Bo.getDadosPorCtstampNdos(osProcessos[0].ct_boentregasstamp, 19)
                .catch(err => {
                    reject(err);
                });
            if (!dadosExpedicao) {
                logg.warn('dadosExpedicao undefined');
                return;
            }

            for (const osProcesso of osProcessos) {
                osProcesso.expedicao = dadosExpedicao;
            }
            resolve(osProcessos);
        });
    }
}
