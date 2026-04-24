export function deserialize(rawValue: string) {
    const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

    function reviver(key: string, currentValue: any) {
        if (typeof currentValue === 'string' && dateFormat.test(currentValue)) {
            return new Date(currentValue);
        }

        return currentValue;
    }
    try {
        const obj = JSON.parse(rawValue, reviver);
        return obj;
    } catch {
        return rawValue;
    }
}

export function serialize(data: any) {

    const replacer = function (this: any, key: string, currentValue: any) {

        if (this[key] instanceof Date) {
            return this[key].toISOString();
        }

        return currentValue;
    };
    const obj = JSON.stringify(data, replacer);
    return obj;
}

export function convertDate(data: any) {
    const dateISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d+)?Z/i;
    const dateNet = /\/Date\((-?\d+)(?:-\d+)?\)\//i;
    const traverse = (o: any, func: any) => {
        for (let i of Object.keys(o)) {
            o[i] = func(i, o[i]);
            if (o[i] !== null && typeof (o[i]) === 'object') {
                traverse(o[i], func);
            }
        }
    };
    const replacer = (key: string, currentValue: any) => {
        if (typeof (currentValue) === 'string') {
            if (dateISO.test(currentValue)) {
                return new Date(currentValue);
            }
            if (dateNet.test(currentValue)) {
                return new Date(parseInt(dateNet.exec(currentValue)[1], 10));
            }
        }
        return currentValue;
    };

    if (data && typeof data === 'object') {
        traverse(data, replacer);
    }
    return data;
}
