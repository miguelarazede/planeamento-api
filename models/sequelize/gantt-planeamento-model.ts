import {DataTypes, Model} from 'sequelize';
import sequelizerIndustria from '../../sequelize/sequelizerIndustria';

export interface IGanttPlaneamento {
    stamp?: string;
    bostamp: string; // bostamp da EC
    obranoec: number;
    id: number;
    parentID: number;
    title: string;
    start: Date;
    end: Date;
    progress: number;
    processo: string;
    tipo: number; // 0: Preparação; 1: Aprovisionamento; 2: OS; 3: Expedição
    oristamp: string;
    relstamp: string; // stamp da OS nos processos
    resourceName: string;
    resourceEmail: string;
    dataLimite: Date;
    fechada: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    isDataDefinida: boolean;
    idTeamsTask: string;
}

export class GanttPlaneamentoModel extends Model {
}

GanttPlaneamentoModel.init(
    {
        stamp: {
            type: 'UNIQUEIDENTIFIER',
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        bostamp: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        obranoec: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: ''
        },
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: ''
        },
        parentID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: ''
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0
        },
        start: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        end: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        progress: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        processo: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        tipo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        oristamp: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        relstamp: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        resourceName: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        resourceEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dataLimite: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: DataTypes.NOW
        },
        fechada: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isDataDefinida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        idTeamsTask: {
            type: DataTypes.STRING(50),
            defaultValue: ''
        },
    }, {
        sequelize: sequelizerIndustria,
        tableName: 'ganttplans',
        freezeTableName: true,
    }
);


