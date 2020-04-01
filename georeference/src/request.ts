import * as request from 'request';

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
export function requestHttp(params: any): Promise<[number, string | any]> {
    return new Promise((resolve, reject) => {
        request(params, (err: Object, response: { statusCode: any }, body: Object) => {
            if (!err) {
                let status = response && response.statusCode;
                return resolve([status, body]);
            } else {
                return reject(err);
            }
        });
    });
}