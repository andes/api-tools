import * as proj4 from 'proj4';
import { Coordenadas } from './index';
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');


// Se realiza la conversión de las coordenadas desde mercator a gauss-krüger mediante la lib 'proj4' (http://proj4js.org/)
// let fromProjection = '+title=*GPS (WGS84) (deg) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees';
// let toProjection = '+proj=tmerc +lat_0=-90 +lon_0=-69 +k=1 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
proj4.defs('GOOGLE', '+title=*GPS (WGS84) (deg) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees');
proj4.defs('GAUSSKRUGGER', '+proj=tmerc +lat_0=-90 +lon_0=-69 +k=1 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

/**
 * Servicio básico de GeoNode
 * [TODO] Parametrizar para usar mas servicios
 * [TODO] Aprender la API de Geonode para mejorar la parametrización de esta funcion
 */

export async function geonode(point: Coordenadas, host: string, user: string, password: string, config: any) {
    if (point) {
        const geoRef = [Number(point.lng), Number(point.lat)];
        const geoRefGK = proj4('GOOGLE', 'GAUSSKRUGGER', geoRef); // geo-referencia en coordenadas gauss-krüger
        const geoBox = (geoRefGK[0] - 10) + ',' + (geoRefGK[1] - 10) + ',' + (geoRefGK[0] + 10) + ',' + (geoRefGK[1] + 10);
        const auth = (user && password) ? Buffer.from(`${user}:${password}`).toString('base64') : null;

        let headers: any = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            timeout: '2L'
        }
        if (auth) {
            headers.Authorization = `Basic ${auth}`;
        }
        const options = { json: true, headers };

        try {
            config.BBOX = geoBox;
            const params = new URLSearchParams(config);
            const response = await fetch(`${host}` + params, options);
            const respuesta = response ? await response.json() : null;
            return respuesta;
        } catch (error) {
            return null;
        }
    }
}

/**
 * Dado un punto en el mapa devuelve el barrio correspondiente
 */

export async function getBarrio(point: Coordenadas, host: string, user: string, pass: string, config: any) {
    let response = await geonode(point, host, user, pass, config);
    if (response && response.features.length) {
        return response.features[0].properties.nombre;
    }
    return null;
}