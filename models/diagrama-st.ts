import * as express from 'express';
import {logg} from '../log/logger';
import {Funcoes} from '../shared/funcoes';
import * as path from 'path';
import {poolDTI} from '../database/sqlDTI';

export interface IDiagramaSTRecord {
    ststamp: string;
    ref: string;
    design: string;
    nivel: number;
    ststamppai: string;
    familia: string;
    id: number;
    origem: string;
    destino: string;
    tipo: string;
    titulo: string;
}

export interface IOrgLink {
    ID: number;
    From: string;
    To: string;
    tipo: string;
}

class DiagramaSt {

    static async getDadosDiagrama(req: express.Request, res: express.Response) {
        const ref: string = <string>req.query.ref;
        if (!ref) {
            const err = new Error('Query parameters sem REF');
            logg.error(err.message);
            res.json({err: err.message});
            return;
        }
        logg.info('A construir diagrama', req.query.ref);

        const caminho = path.join(process.cwd(), 'query', 'diagramas', 'diagramast.sql');
        const sql = await Funcoes.getConteudoFicheiro(caminho)
            .catch((err) => {
                logg.error(err.message);
                res.json({err: err.message});
            });

        if (!sql) return;

        const pool = await poolDTI
            .catch((err) => {
                logg.error(err.message);
                res.json({err: err.message});
            });
        if (!pool) return;

        const retSql = await pool.request()
            .input('ref', ref)
            .query(sql)
            .catch((err) => {
                logg.error(err.message);
                res.json({err: err.message});
            })
        ;
        if (!retSql) return;

        const recordset: IDiagramaSTRecord[] = retSql.recordset;
        const elementos = recordset.slice();
        const itens: IDiagramaSTRecord[] = [];
        const links: IOrgLink[] = [];
        let idLink = 0;
        for (const elemento of elementos) {
            elemento.titulo = elemento.ref.trim().concat('\n', elemento.design.trim(), '\n', elemento.familia);
            if (elemento.tipo.localeCompare('PROCESSO') === 0) {
                elemento.titulo = elemento.ref.trim().concat('\n', elemento.design.trim());
            }
            if (elemento.origem.localeCompare('') !== 0 && elemento.destino.localeCompare('') !== 0) {
                idLink++;
                const link: IOrgLink = {
                    ID: idLink,
                    From: elemento.origem,
                    To: elemento.destino,
                    tipo: elemento.tipo,
                };
                links.push(link);
            }
            itens.push(elemento);
        }
        res.json({itens, links, recordset});
    }
}

export {DiagramaSt};
