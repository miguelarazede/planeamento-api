import * as express from 'express';
import {GanttPlaneamentoModel, IGanttPlaneamento} from '../models/sequelize/gantt-planeamento-model';
import {distinct, from} from 'rxjs';
import {GanntPlaneamento} from '../models/gannt-planeamento';

interface ITask {
    id: number;
    parentId?: number;
    title: string;
    start: Date;
    end: Date;
    progress: number;
    processo: string;
    oristamp: string;
    tipo: number;
    bostamp: string;
    obranoec: number;
    isDataDefinida: boolean; // se a data de entrega ao cliente está definida
}

interface IDependency {
    id: number;
    predecessorId: number;
    successorId: number;
    type: number;
}

interface IRetTaskDependency {
    tasks: ITask[];
    dependencys: IDependency[];
    idTaskMaster: number,
    idDependencyMaster: number
}

export class WorkerGantt {
    static async getMapaGanttTotal(req: express.Request, res: express.Response) {
        const registos = await GanttPlaneamentoModel.findAll({
            where: {
                fechada: false
            },
            order: ['bostamp', 'tipo', 'title', 'relstamp', 'id']
        })
            .catch((err: Error) => {
                res.json(err);
            });
        if (!registos) {
            return;
        }

        const mapa: { tasks: ITask[], dependencys: IDependency[] } = WorkerGantt.contruirTasksAndDependecys(registos);
        const tasks: ITask[] = mapa.tasks;
        const dependencys: IDependency[] = mapa.dependencys;

        res.json({tasks: JSON.stringify(tasks), dependencys: JSON.stringify(dependencys), registos});
    }

    private static contruirTasksAndDependecys(registos: GanttPlaneamentoModel[]): { tasks: ITask[], dependencys: IDependency[] } {
        const tasks: ITask[] = [];
        const dependencys: IDependency[] = [];

        const mapa: IGanttPlaneamento[] = [];
        for (const registo of registos) {
            mapa.push(registo.get());
        }
        mapa.sort((a, b) => {
            if (a.obranoec > b.obranoec) return 1;
            if (a.obranoec < b.obranoec) return -1;
            return 0;
        });
        const distintBostamps: string[] = [];
        from(mapa.map((x) => x.bostamp))
            .pipe(
                distinct(),
            )
            .subscribe((x) => {
                distintBostamps.push(x);
            });
        let idTaskMaster = 0;
        let idDependencyMaster = 0;
        for (const bostamp of distintBostamps) {
            const ret: IRetTaskDependency = this.getConstruirGanttDoBostamp(bostamp, idTaskMaster, idDependencyMaster, mapa);
            tasks.push(...ret.tasks);
            dependencys.push(...ret.dependencys);
            idTaskMaster = ret.idTaskMaster;
            idDependencyMaster = ret.idDependencyMaster;
        }

        return {tasks, dependencys};
    }

    private static getConstruirGanttDoBostamp(
        bostamp: string,
        idTaskMaster: number,
        idDependencyMaster: number,
        mapa: IGanttPlaneamento[]
    ): IRetTaskDependency {
        const tasks: ITask[] = [];
        const dependencys: IDependency[] = [];

        const registos = mapa.filter(x => x.bostamp.localeCompare(bostamp) === 0);
        const registosSlice = registos.slice();

        let idEC = 0;
        let idPlaneamento = 0;
        let idPreparacao = 0;
        let idOS = 0;
        let parentId = 0;
        for (const registo of registos) {
            if (registo.tipo === GanntPlaneamento.TIPO_EC) {
                idTaskMaster++;
                idEC = idTaskMaster;
                this.pushTask(tasks, idTaskMaster, parentId, registo);
            }
            if (registo.tipo === GanntPlaneamento.TIPO_ITEM_PLANEAMENTO) {
                parentId = idEC;
                idTaskMaster++;
                idPlaneamento = idTaskMaster;
                this.pushTask(tasks, idTaskMaster, parentId, registo);

                const listaDoPlaneamento = registosSlice.filter(x => x.relstamp.localeCompare(registo.oristamp) === 0);
                for (const OSouPreparacao of listaDoPlaneamento) {
                    if (OSouPreparacao.tipo === GanntPlaneamento.TIPO_PREPARACAO) {
                        parentId = idPlaneamento;
                        idTaskMaster++;
                        idPreparacao = idTaskMaster;
                        this.pushTask(tasks, idTaskMaster, parentId, OSouPreparacao);
                    }
                    if (OSouPreparacao.tipo === GanntPlaneamento.TIPO_OS) {
                        parentId = idPlaneamento;
                        idTaskMaster++;
                        idOS = idTaskMaster;
                        this.pushTask(tasks, idTaskMaster, parentId, OSouPreparacao);

                        // Processos da OS
                        const listaProcessos = registosSlice.filter(
                            x => x.relstamp.localeCompare(OSouPreparacao.oristamp) === 0
                                && x.tipo === GanntPlaneamento.TIPO_PROCESSOS_OS);
                        listaProcessos.sort((a, b) => {
                            if (a.id > b.id) {
                                return 1;
                            }
                            if (a.id < b.id) {
                                return -1;
                            }
                            return 0;
                        });
                        for (const processo of listaProcessos) {
                            parentId = idOS;
                            idTaskMaster++;
                            this.pushTask(tasks, idTaskMaster, parentId, processo);
                            if (processo.id === 1 && idPreparacao != 0) {
                                idDependencyMaster++;
                                dependencys.push({
                                    id: idDependencyMaster,
                                    predecessorId: idPreparacao,
                                    successorId: idTaskMaster,
                                    type: 0
                                });
                            }
                            if (processo.id > 1) {
                                idDependencyMaster++;
                                dependencys.push({
                                    id: idDependencyMaster,
                                    predecessorId: idTaskMaster - 1,
                                    successorId: idTaskMaster,
                                    type: 2
                                });
                            }
                        }
                    }
                    if (OSouPreparacao.tipo === GanntPlaneamento.TIPO_EXPEDICAO) {
                        parentId = idPlaneamento;
                        idTaskMaster++;
                        this.pushTask(tasks, idTaskMaster, parentId, OSouPreparacao);
                    }
                }
            }
        }
        return {tasks, dependencys, idTaskMaster: idTaskMaster, idDependencyMaster};
    }

    private static pushTask(tasks: ITask[], idTaskMaster: number, parentId: number, registo: IGanttPlaneamento) {
        tasks.push(
            {
                id: idTaskMaster,
                parentId,
                title: registo.title, // .concat(` (${idTaskMaster})`),
                start: registo.start,
                end: registo.end,
                progress: registo.progress,
                // progress: 50,
                processo: registo.processo,
                oristamp: registo.oristamp,
                tipo: registo.tipo,
                bostamp: registo.bostamp,
                obranoec: registo.obranoec,
                isDataDefinida: registo.isDataDefinida
            },
        );
    }
}
