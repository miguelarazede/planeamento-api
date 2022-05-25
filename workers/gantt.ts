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
    static async getMapaGantt(req: express.Request, res: express.Response) {
        const registos = await GanttPlaneamentoModel.findAll({
            where: {
                fechada: false
            },
            order: ['bostamp', 'tipo', 'id']
        })
            .catch((err: Error) => {
                res.json(err);
            });
        if (!registos) {
            return;
        }

        const mapa: { tasks: ITask[], dependencys: IDependency[] } = WorkerGantt.getTasks(registos);
        const tasks: ITask[] = mapa.tasks;
        const dependencys: IDependency[] = mapa.dependencys;

        res.json({tasks: JSON.stringify(tasks), dependencys: JSON.stringify(dependencys), registos});
    }

    private static getTasks(registos: GanttPlaneamentoModel[]): { tasks: ITask[], dependencys: IDependency[] } {
        const tasks: ITask[] = [];
        const dependencys: IDependency[] = [];

        const mapa: IGanttPlaneamento[] = [];
        for (const registo of registos) {
            mapa.push(registo.get());
        }

        const distintBostamps: string[] = [];
        from(mapa.map(x => x.bostamp))
            .pipe(
                distinct(),
            )
            .subscribe(x => {
                distintBostamps.push(x);
            });
        let idTaskMaster = 0;
        let idDependencyMaster = 0;
        for (const bostamp of distintBostamps) {
            const ret: IRetTaskDependency = this.getMapaGanttBostamp(bostamp, idTaskMaster, idDependencyMaster, mapa);
            tasks.push(...ret.tasks);
            dependencys.push(...ret.dependencys);
            idTaskMaster = ret.idTaskMaster;
        }


        return {tasks, dependencys};
    }

    private static getMapaGanttBostamp(
        bostamp: string,
        idTaskMaster: number,
        idDependencyMaster: number,
        mapa: IGanttPlaneamento[]): IRetTaskDependency {
        const tasks: ITask[] = [];
        const dependencys: IDependency[] = [];

        const registos = mapa.filter(x => x.bostamp.localeCompare(bostamp) === 0);

        let idEC = 0;
        let idPlaneamento = 0;
        let idPreparacao = 0;
        let idOS = 0;
        let parentId = 0;
        for (const registo of registos) {
            if (registo.tipo === GanntPlaneamento.TIPO_EC) {
                idTaskMaster++;
                idEC = idTaskMaster;
            }
            if (registo.tipo === GanntPlaneamento.TIPO_ITEM_PLANEAMENTO) {
                parentId = idEC;
                idTaskMaster++;
                idPlaneamento = idTaskMaster;
            }
            if (registo.tipo === GanntPlaneamento.TIPO_PREPARACAO) {
                parentId = idPlaneamento;
                idTaskMaster++;
                idPreparacao = idTaskMaster;
            }
            if (registo.tipo === GanntPlaneamento.TIPO_OS) {
                parentId = idPlaneamento;
                idTaskMaster++;
                idOS = idTaskMaster;
            }
            if (registo.tipo === GanntPlaneamento.TIPO_PROCESSOS_OS) {
                parentId = idOS;
                idTaskMaster++;
                if (registo.id === 1 && idPreparacao != 0) {
                    idDependencyMaster++;
                    dependencys.push({
                        id: idDependencyMaster,
                        predecessorId: idPreparacao,
                        successorId: idTaskMaster,
                        type: 0
                    });
                }
                if (registo.id > 1) {
                    idDependencyMaster++;
                    dependencys.push({
                        id: idDependencyMaster,
                        predecessorId: idTaskMaster - 1,
                        successorId: idTaskMaster,
                        type: 0
                    });
                }
            }
            if (registo.tipo === GanntPlaneamento.TIPO_EXPEDICAO) {
                parentId = idPlaneamento;
                idTaskMaster++;
            }
            tasks.push(
                {
                    id: idTaskMaster,
                    parentId,
                    title: registo.title,
                    start: registo.start,
                    end: registo.end,
                    progress: registo.progress,
                    processo: registo.processo,
                    oristamp: registo.oristamp
                },
            );
        }
        return {tasks, dependencys, idTaskMaster: idTaskMaster, idDependencyMaster};
    }
}
