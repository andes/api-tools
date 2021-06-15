export function deserialize(value: string) {
    const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

    function reviver(key: string, value: any) {
        if (typeof value === 'string' && dateFormat.test(value)) {
            return new Date(value);
        }

        return value;
    }
    try {
        const obj = JSON.parse(value, reviver);
        return obj;
    } catch {
        return value;
    }
}

export function serialize(value: any) {

    const replacer = function (this: any, key: string, value: any) {

        if (this[key] instanceof Date) {
            return this[key].toISOString();
        }

        return value;
    };
    const obj = JSON.stringify(value, replacer);
    return obj;
}

export function convertDate(data: any) {
    const dateISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d+)?Z/i;
    const dateNet = /\/Date\((-?\d+)(?:-\d+)?\)\//i;
    const traverse = function (this: any, o: any, func: any) {
        for (let i of Object.keys(o)) {
            o[i] = func.apply(this, [i, o[i]]);
            if (o[i] !== null && typeof (o[i]) === 'object') {
                traverse(o[i], func);
            }
        }
    };
    const replacer = function (key: string, value: any) {
        if (typeof (value) === 'string') {
            if (dateISO.test(value)) {
                return new Date(value);
            }
            if (dateNet.test(value)) {
                return new Date(parseInt(dateNet.exec(value)[1], 10));
            }
        }
        return value;
    };

    if (data && typeof data === 'object') {
        traverse(data, replacer);
    }
    return data;
}

