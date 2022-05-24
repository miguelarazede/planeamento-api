import * as fs from 'fs';

export class Funcoes {
    static async getConteudoFicheiro(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(path, {encoding: 'utf8'}, (err, conteudo) => {
                if (err) {
                    return reject(err);
                }
                return resolve(conteudo);
            });
        });
    }

    static getFriendlyEstado(processo: string): string {
        const idx = processo.indexOf('-');
        let text = processo.substring(idx + 1).trim();
        text = text.replace('BAMER', '').trim();
        return text;
    }
}
