import {Socket as socket} from 'socket.io';
import {BehaviorSubject} from 'rxjs';
import {GanntPlaneamento} from '../models/gannt-planeamento';
import {logg} from '../log/logger';
import {CtBoentregas} from '../models/ct-boentregas';

export class Socket {
    private readonly io: socket;
    private socketObserver: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    constructor(httpServer: any) {
        this.io = require('socket.io')(httpServer, {
            pingInterval: 10000,
            // https://stackoverflow.com/questions/53230858/websocket-is-already-in-closing-or-closed-state-socket-io
            pingTimeout: 60000,
            cookie: false,
            forceNew: true,
            cors: {
                origin: '*',
            }
        });
        this.init();
        this.socketObserver.subscribe((numSockets) => {
            logg.info(`Sockets: ${numSockets}`);
        });
    }

    private static configSocketModels(io: socket, socket: socket) {
        CtBoentregas.socket(io, socket);
        GanntPlaneamento.socket(io, socket);
    }

    private init() {
        this.io.on('connect', (socket) => {
            // logg.info(`Socket ligou id ${socket.id}`);
            const userIn = this.socketObserver.getValue();
            this.socketObserver.next(userIn + 1);

            Socket.configSocketModels(this.io, socket);

            socket.on('disconnect', () => {
                logg.warn(`Socket desligou id ${socket.id}`);
                const userOut = this.socketObserver.getValue();
                this.socketObserver.next(userOut - 1);
            });

        });
    }
}
