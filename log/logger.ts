import * as log4js from 'log4js';

log4js.configure({

    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                // pattern: '%[%d{dd.MM.yyyy hh:mm:ss} %0.15c->%4p:%] %f{2}#%l %n %[ %m %]',
                pattern: '%d{dd.MM.yyyy hh:mm:ss}  %f{2} #%l %n%[%m%]%n',
            },
        },

        ficheiro: {
            type: 'file',
            filename: 'applog.log',
            maxLogSize: 10485760,
            layout: {
                type: 'pattern',
                pattern: '%d{dd.MM.yyyy hh:mm:ss}  %f{2} #%l %n %m',
            },
        },
        ficheiroTemp: {
            type: 'file',
            filename: 'temp.log',
            maxLogSize: 10485760,
            layout: {
                type: 'pattern',
                pattern: '%d{dd.MM.yyyy hh:mm:ss}  %f{2} #%l %n %m',
            },
        },
        logQualidade: {
            type: 'file',
            filename: 'qualidade.log',
            maxLogSize: 10485760,
            // layout: {
            //     type: 'pattern',
            //     pattern: '%[%d{dd.MM.yyyy hh:mm:ss} %0.15c->%4p:%] %f{1}#%l %n%[%m%]',
            // },
        },
    },
    categories: {
        default: {appenders: ['console'], level: 'debug', enableCallStack: true},

        logQualidade: {appenders: ['logQualidade'], level: 'debug', enableCallStack: true},
        DataFormCtrl: {appenders: ['logQualidade'], level: 'debug', enableCallStack: true},
    },
});

export default log4js;
