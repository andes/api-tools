import * as moment from 'moment';
import { makePattern } from './utils';
import * as mongoose from 'mongoose';
import { isNullOrUndefined } from 'util';

export function matchDate(value: string) {
    let query = {};
    let fecha;
    let fechas = value.split('|');
    if (fechas.length > 1) {
        query = {
            $gte: transformDate(fechas[0], true),
            $lte: transformDate(fechas[1], false)
        };
    } else {
        if (value.substr(0, 2) === '>=') {
            fecha = value.substr(2);
            query = { $gte: transformDate(fecha, true) };
        } else if (value.substr(0, 1) === '>') {
            fecha = value.substr(1);
            query = { $gt: transformDate(fecha, true) };
        } else if (value.substr(0, 2) === '<=') {
            fecha = value.substr(2);
            query = { $lte: transformDate(fecha, true) };
        } else if (value.substr(0, 1) === '<') {
            fecha = value.substr(1);
            query = { $lt: transformDate(fecha, true) };
        } else {
            query = {
                $gte: transformDate(value, true),
                $lte: transformDate(value, false)
            };
        }
    }
    return query;
}
matchDate.withField = (field: string) => {
    return { field, fn: matchDate };
};

export function transformDate(fecha: string, start: boolean) {
    if (moment(fecha, 'YYYY-MM-DD', true).isValid()) {
        if (start) {
            return moment(fecha).startOf('day').toDate();
        } else {
            return moment(fecha).endOf('day').toDate();
        }
    } else {
        return moment(fecha).toDate();
    }
}

export function partialString(value: string) {
    if (value && value.charAt(0) === '^') {
        const searchPattern = value.substring(1);
        return { $regex: makePattern(searchPattern) };
    }
    return value;
}

partialString.withField = (field: string) => {
    return { field, fn: partialString };
};

export function matchString(value: string) {
    return value;
}

matchString.withField = (field: string) => {
    return { field, fn: matchString };
};

export function equalMatch(value: string | boolean | number) {
    if (typeof value === 'string') {
        if (value && value.charAt(0) === '~') {
            return { $ne: value.substring(1) };
        }
    }
    return value;
}

equalMatch.withField = (field: string) => {
    return { field, fn: equalMatch };
};

export function inArray(value: any | any[]) {
    const v = Array.isArray(value) ? value : [value];
    return { $in: v };
}

inArray.withField = (field: string) => {
    return { field, fn: inArray };
};

export function equalOrNull(value: any | any[]) {
    return { $in: [null, value] };
}

equalOrNull.withField = (field: string) => {
    return { field, fn: equalOrNull };
};

/**
 * Devuelve una query con elemMatch por keyName y valueName
 *
 * @param {string} value
 * @param {string} keyName
 * @param {string} valueName
 */

export function queryMatch(value: string, keyName: string, valueName: string) {
    let ids = value.split('|');
    let filtro = {};
    if (ids[0]) {
        filtro[keyName] = ids[0];
    }
    if (ids[1]) {
        if (mongoose.isValidObjectId(ids[1])) {
            filtro[valueName] = mongoose.isValidObjectId(ids[1]);
        } else {
            filtro[valueName] = partialString(ids[1]);
        }
    }
    return { $elemMatch: filtro };
}

/**
 * Devuelve una condición con operador (and, or) para buscar elementos en un arreglo a través del elemMatch
 *
 * @export
 * @param {string} fieldName
 * @param {Array<string>} values
 * @param {string} keyName
 * @param {string} valueName
 * @returns {Object}
 */


export function queryArray(fieldName: string, values: any[], keyName: string, valueName: string, op = 'and') {
    values = Array.isArray(values) ? values : [values];
    const conds: any[] = [];
    values.forEach(valor => {
        const filtro = {};
        filtro[fieldName] = queryMatch(valor, keyName, valueName);
        conds.push(filtro);
    });
    if (op === 'or') {
        return { $or: conds };
    }
    return { $and: conds };
}

function processParam(fieldName: string, queryParam: any) {
    const isFunction = typeof queryParam === 'function';

    const callback = isFunction ? queryParam : queryParam.fn;
    const field = isFunction ? fieldName : queryParam.field;

    return [field, callback];
}

export function buildQuery(query: object, searchSpecification: object) {
    const mongoQuery = {};
    const $and: object[] = [];

    Object.keys(query).forEach((item) => {
        if (isNullOrUndefined(searchSpecification[item])) {
            return;
        }
        const specification = searchSpecification[item];
        const filterValue = query[item];
        if (Array.isArray(specification)) {
            const $or: any = {
                $or: (specification as string[]).map(i => {
                    const [field, callback] = processParam(i, searchSpecification[i]);
                    const constrain = callback(filterValue, query);
                    if (!constrain['$and'] && !constrain['$or']) {
                        return { [field]: constrain };
                    } else {
                        return constrain;
                    }
                })
            };
            $and.push($or);
        } else {
            const [field, callback] = processParam(item, specification);
            const constrain = callback(filterValue, query);
            if (!constrain['$and'] && !constrain['$or']) {
                mongoQuery[field] = constrain;
            } else {
                $and.push(constrain);
            }
        }
    });
    if ($and.length > 0) {
        mongoQuery['$and'] = $and;
    }
    return mongoQuery;
}

export const MongoQuery = {
    equalMatch,
    matchDate,
    partialString,
    matchString,
    queryMatch,
    queryArray,
    buildQuery,
    inArray,
    equalOrNull
};
