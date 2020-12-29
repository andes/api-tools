import moment = require('moment');
import { transform } from './core';

export class ETL {

    private _functions = {
        concat: (...args: string[]) => {
            return args.join('');
        },
        dateToString: (value: Date, format: string) => {
            return moment(value).format(format);
        },
        stringToDate: (value: string, format: string) => {
            return moment(value, format);
        }
    };

    private _schemas = {

    };

    private schema: any = null;

    constructor(schema: any = null) {
        this.schema = schema;
    }

    addFunction(name: string, fn: any) {
        this._functions[name] = fn;
    }

    addSchema(name: string, dto: any) {
        this._schemas[name] = dto;
    }


    transform(data: any, schema: any = null) {
        const _schema = schema || this.schema;

        return transform(
            {
                functions: this._functions,
                schemas: this._schemas
            },
            _schema,
            data
        );
    }

}
