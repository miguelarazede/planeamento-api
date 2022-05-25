import {DataTypes, Model} from 'sequelize';
import {GamaOpLinModel} from './gamas-op-lin-model';
import sequelizerBamer from '../../sequelize/sequelizerBamer';
import {GamaOpCabModel} from './gama-op-cab-model';

export interface IOsProcessos {
    stamp: string;
    bostamp: string;
    ordem: number;
    planeado: boolean;
    inicio: Date;
    fim: Date;
    email: string;
    isHistory: boolean;
    origem: string;
    ct_boentregasstamp;
}

export class OSProcessosModel extends Model {
}

exports.OSProcessosModel = OSProcessosModel.init(
    {
        stamp: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        bostamp: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
        ordem: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        planeado: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        inicio: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        fim: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        isHistory: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0,
        },
        origem: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        ct_boentregasstamp: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
        tabela1: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
        tabela2: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
    }, {
        sequelize: sequelizerBamer,
        freezeTableName: true,
        tableName: '_os_processos'
    }
);

GamaOpCabModel.hasMany(OSProcessosModel, {foreignKey: 'gamacabstamp'});
OSProcessosModel.belongsTo(GamaOpCabModel, {foreignKey: 'gamacabstamp'});
GamaOpLinModel.hasMany(OSProcessosModel, {foreignKey: 'gamalinstamp'});
OSProcessosModel.belongsTo(GamaOpLinModel, {foreignKey: 'gamalinstamp'});



