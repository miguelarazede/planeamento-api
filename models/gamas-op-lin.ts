import {GamaOpLinModel} from './sequelize/gamas-op-lin-model';
import {GamaOpCabModel} from './sequelize/gama-op-cab-model';

export class GamaOpLin {
    static async getDados(gamalinstamp: string): Promise<GamaOpLinModel | null> {
        return new Promise((resolve, reject) => {
            GamaOpLinModel.findOne({
                where: {
                    stamp: gamalinstamp
                },
                include: [
                    {
                        model: GamaOpCabModel,
                    }
                ]
            })
                .then((res) => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}
