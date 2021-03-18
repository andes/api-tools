const { JSONPath } = require('jsonpath-plus');

function extract(path: string, data: any) {
    const resultado = JSONPath({
        path,
        json: data,
        wrap: false
    });
    return resultado;

}

export function transform(ctx: any, schema: any, data: any) {

    if (typeof schema === 'string' && schema.startsWith('$')) {
        const v = extract(schema, data);
        return v;
    } else if (Array.isArray(schema)) {

        const v: any = schema.map(elem => transform(ctx, elem, data));
        return v;

    } else if (typeof schema === 'object') {

        const isArrayClouse = Object.keys(schema).length === 1 && schema['$array'];
        const isApplyClouse = Object.keys(schema).length === 1 && schema['$apply'];
        const isTransformClouse = Object.keys(schema).length === 1 && schema['$transform'];
        const isIFClouse = Object.keys(schema).length === 1 && schema['$if'];

        if (isArrayClouse) {

            const arrayData = schema['$array'];

            const target = arrayData.target;
            const subSchema = arrayData.schema;

            const array = extract(target, data);
            const mapped = array.map((elem: any) => transform(ctx, subSchema, elem));

            return mapped;

        } else if (isApplyClouse) {

            const applyData = schema['$apply'];

            const target = applyData.target;
            const fnName = applyData.fn;
            const args: any[] = applyData.args || [];

            const fn = ctx.functions[fnName];

            // [TODO] Si es un string que lo evalue.
            const args2 = args.map((item: any) => {
                if (typeof item === 'string' && item.startsWith('$')) {
                    return extract(item, data);
                }
                return item;
            });

            const argumentos = [];
            if (target) {
                const v = extract(target, data);
                argumentos.push(v);
            }

            const r = fn.apply(null, [...argumentos, ...args2]);

            return r;

        } else if (isTransformClouse) {

            const transformData = schema['$transform'];
            const target = transformData.target;
            const schemaName = transformData.schemaName;

            const schemaDef = ctx.schemas[schemaName];

            const value = extract(target, data);

            const internal: any = transform(ctx, schemaDef, value);

            return internal;

        } else if (isIFClouse) {
            const ifData: any = schema['$if'];

            const cond: any = ifData.cond;
            const thenSchema: any = ifData.then;
            const elseSchema: any = ifData.else;

            const evalCond: any = transform(ctx, cond, data);

            if (evalCond) {
                const evalThen: any = transform(ctx, thenSchema, data);
                return evalThen;
            } else if (elseSchema) {
                const evalElse: any = transform(ctx, elseSchema, data);
                return evalElse;
            } else {
                return null;
            }
        } else {
            const d = {};
            Object.keys(schema).forEach(key => {
                const internal = transform(ctx, schema[key], data);
                d[key] = internal;
            });
            return d;
        }


    } else {
        return schema;
    }
}
