import * as express from 'express';
import {WorkerGantt} from '../workers/gantt';
import {DiagramaSt} from '../models/diagrama-st';

export class Api {
    router = express.Router();

    constructor() {
        this.intializeRoutes();
    }


    private intializeRoutes() {
        this.router.get('/status', this.getStatus);
        this.router.post('/status', this.postStatus);
        this.router.get('/mapa-gantt', WorkerGantt.getMapaGanttTotal);
        this.router.get('/diagramast', DiagramaSt.getDadosDiagrama);
    }

    private postStatus = (request: express.Request, response: express.Response) => {
        response.json({resposta: 'API POST status: ON', payload: request.body});
    };

    private getStatus = (request: express.Request, response: express.Response) => {
        response.json('API GET com status: ON');
    };
}
