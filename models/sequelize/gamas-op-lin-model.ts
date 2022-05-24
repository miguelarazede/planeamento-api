import {DataTypes, Model} from 'sequelize';
import sequelizerBamer from '../../sequelize/sequelizerBamer';

export interface IGamaOpLin {
    stamp: string;
    processo: string;
    ordem: string;
    calculo: string;
    createdAt: Date;
    updatedAt: Date;
    gamacabstamp: string;
}

export class GamaOpLinModel extends Model {
}

GamaOpLinModel.init(
    {
        stamp: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        processo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        ordem: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        calculo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'unidade'
        }
    },
    {
        sequelize: sequelizerBamer,
        freezeTableName: true,
        tableName: 'gamasoplins'
    }
);



