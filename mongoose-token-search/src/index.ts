import { Schema, Document, Model } from 'mongoose';

const ExpRegFilter = /([-_()\[\]{}+?*.$\^|¨`´~,:#<>¡!\\])/g;

type ITokenSearchOpciones = {
    exact?: boolean,
    minLength?: number
};

export function TokenSearch(fields: string[]) {

    return (schema: Schema) => {

        schema.add({
            tokens: [String]
        });

        schema.index({
            tokens: 1
        });

        schema.pre('save', function (this: any, next: any) {
            const modelo = this;
            modelo._createTokens();
            next();
        });

        schema.methods._createTokens = function () {

            const modelo = this as any;

            const tokens: string[] = [];

            for (const field of fields) {

                const campo = modelo[field];

                if (typeof campo === 'string' && campo.length > 0) {
                    campo
                        .toLowerCase()
                        .replace(ExpRegFilter, '')
                        .split(' ')
                        .filter(el => el.length > 0)
                        .forEach(doc => {
                            tokens.push(doc);
                        });
                }

            }

            modelo.tokens = tokens.map(replaceChars);
        };

        schema.static('search', (input: string, opciones: ITokenSearchOpciones) => {

            opciones = opciones || {};
            let { exact, minLength } = opciones;

            if (exact === undefined) {
                exact = true;
            }

            if (minLength === undefined) {
                minLength = 1;
            }

            const andQuery: any[] = [];
            input
                .replace(ExpRegFilter, '')
                .trim()
                .toLowerCase()
                .split(' ')
                .map(replaceChars)
                .filter(l => l.length >= minLength)
                .forEach((w, index, array) => {
                    const lastElement = array.length === index + 1;
                    if (lastElement || !exact) {
                        andQuery.push({ tokens: RegExp(`^${w}`) });
                    } else {
                        andQuery.push({ tokens: w });
                    }
                });

            return {
                $and: andQuery
            };

        });

    };


}

export function replaceChars(text: string) {
    text = text.replace(/á/gi, 'a');
    text = text.replace(/é/gi, 'e');
    text = text.replace(/í/gi, 'i');
    text = text.replace(/ó/gi, 'o');
    text = text.replace(/ú/gi, 'u');
    text = text.replace(/ü/gi, 'u');
    text = text.replace(/ñ/gi, 'n');
    return text;
}

export interface ITokenSearch<T extends Document> extends Model<T> {
    /**
     * Crear una query de busqueda por tokens.
     * @param text Texto a buscar
     * @param exact Indica si los terminos son exactos o parciales. Si es verdadero solo el ultimo termino se considera parcial.
     */
    search(text: string, opciones?: ITokenSearchOpciones): any;
}
