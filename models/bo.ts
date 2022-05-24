import {poolBamer} from '../database/sqlPHC';

export interface IBo {
    trab5: string;
    fref: string;
    nmfref: string;
    nome2: string;
    obrano: number;
    bostamp: string;
    datafinal: Date;
}

export class Bo {

    static async getDadosPorBostamp(bostamp: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const pool = await poolBamer.catch(err => {
                reject(err);
            });
            if (!pool) {
                return;
            }
            let sqlQuery = `
                select top 1 bo.*, isnull(fref.nmfref, '') as nmfref 
                from bo
                    left join fref on bo.fref = fref.fref 
                where bostamp = @bostamp 
            `
            ;
            const recs = await pool
                .request()
                .input('bostamp', bostamp)
                .query(sqlQuery)
                .catch(err => {
                    reject(err);
                });
            if (!recs) {
                return;
            }
            if (!recs.recordset) {
                reject(new Error(`${bostamp} não devolveu valores`));
                return;
            }
            resolve(recs.recordsets[0][0]);
        });
    }

    static getDadosPorCtstampNdos(ct_boentregasstamp: string, ndos: number): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const pool = await poolBamer.catch(err => {
                reject(err);
            });
            if (!pool) {
                return;
            }
            let sqlQuery = `
                select top 1 bo.*, isnull(fref.nmfref, '') as nmfref 
                from bo
                    inner join bo2 on bo.bostamp = bo2.bo2stamp
                    inner join ct_boentregas ct on bo2.u_ctboitem = ct.ct_boentregasstamp
                    left join fref on bo.fref = fref.fref 
                where ct.ct_boentregasstamp = @ct_boentregasstamp
                    and bo.ndos = @ndos
            `
            ;
            const recs = await pool
                .request()
                .input('ct_boentregasstamp', ct_boentregasstamp)
                .input('ndos', ndos)
                .query(sqlQuery)
                .catch(err => {
                    reject(err);
                });
            if (!recs) {
                return;
            }
            if (!recs.recordset) {
                reject(new Error(` ct_boentregasstamp [${ct_boentregasstamp}] e ndos [${ndos}] não devolveu valores`));
                return;
            }
            resolve(recs.recordsets[0][0]);
        });
    }
}
