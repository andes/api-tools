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
            return await res.text();
        }
    } else {
        const body = await res.text().catch(() => '');
        const error = new Error(`HTTP ${res.status} ${res.statusText} - ${body}`);
        // Agregamos info extra al objeto de error
        (error as any).status = res.status;
        (error as any).statusText = res.statusText;
        (error as any).body = body;
        throw error;
    }
}
