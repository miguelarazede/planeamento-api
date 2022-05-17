import {Socket as socket} from 'socket.io';
import {BehaviorSubject} from 'rxjs';
import * as log4js from '../log/logger';

const logg = log4js.default.getLogger('server');

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

    getIO() {
        return this.io;
    }

    private init() {
        this.io.on('connect', (socket) => {
            // logg.info(`Socket ligou id ${socket.id}`);
            const userIn = this.socketObserver.getValue();
            this.socketObserver.next(userIn + 1);

            socket.on('disconnect', () => {
                logg.warn(`Socket desligou id ${socket.id}`);
                const userOut = this.socketObserver.getValue();
                this.socketObserver.next(userOut - 1);
            });

        });
    }
}
