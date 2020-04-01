// import * as request from 'node-fetch';
const fetch = require('node-fetch');

/**
 *
 *
 * @export
 * @param {*} params ={
            host,
            port,
            path,
            method: 'GET/PUT/POST...',
            rejectUnauthorized: boolean
        }
 * @returns {Promise<[status,body]>}
 */

export async function requestHttp(params: any): Promise<[number, string | any]> {
    const paramKeys = Object.keys(params.qs);
    const paramValues = Object.values(params.qs);
    let url = params.url;
    for (let i = 0; i < paramKeys.length; i++) {
        let separator = (i === 0) ? '?' : '&';
        url += separator + paramKeys[i] + '=' + paramValues[i];
    }
    try {
        const response = await fetch(url)
            .then((res: any) => {
                return res.json();
            });
        return response;
    } catch (err) {
        return err;
    }
}
