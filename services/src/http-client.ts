import { ETL } from '@andes/etl';
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

export async function HTTPClient(etl: ETL, config: any, datos: any) {

    const datosETL = etl.transform(datos, config);

    let { url, params, json, form, ...opts } = datosETL;

    if (params) {
        const urlQuery = new URLSearchParams(params);
        url += '?' + urlQuery.toString();
    }

    if (form && opts.body) {
        const formData = new URLSearchParams(opts.body);
        opts.body = formData.toString();
    } else if (json && opts.body) {
        opts.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, opts);
    if (res.ok) {
        if (json) {
            return await res.json();
        } else {
            return res.text();
        }
    } else {
        throw new Error(res.statusText);
    }
}


// const servicioEjemplo = {
//     name: 'sisa-get-ciudadano',
//     type: 'http-client',
//     configuration: {
//         url: '',
//         method: 'POST',
//         body: form,
//         headers: {},
//         params: {},
//         json : true
//     }
// };


// HTTPClient(
//     {
//         url: {
//             $apply: {
//                 fn: 'concat',
//                 args: ['$.dominio', '/api/core/tm/paises']
//             }
//         },
//         method: 'GET',
//         params: {
//             nombre: '$.nombre'
//         },
//         json: false
//     },
//     {
//         nombre: 'arg',
//         dominio: 'https://test.andes.gob.ar'
//     }
// ).then(console.log);
