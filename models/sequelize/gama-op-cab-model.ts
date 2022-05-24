import {DataTypes, Model} from 'sequelize';
import {GamaOpLinModel, IGamaOpLin} from './gamas-op-lin-model';
import sequelizerBamer from '../../sequelize/sequelizerBamer';

export interface IGamaOpCab {
    stamp: string;
    titulo: string;
    codigo: string;
    createdAt: Date;
    updatedAt: Date;
    gamasoplins: IGamaOpLin[];
}

export class GamaOpCabModel extends Model {
}

exports.GamaOpCabModel = GamaOpCabModel.init(
    {
        stamp: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        titulo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
    }, {
        sequelize: sequelizerBamer,
        freezeTableName: true,
        tableName: 'gamasopcabs'
    }
);

GamaOpCabModel.hasMany(GamaOpLinModel, {foreignKey: 'gamacabstamp', onDelete: 'CASCADE'});
GamaOpLinModel.belongsTo(GamaOpCabModel, {foreignKey: 'gamacabstamp'});



