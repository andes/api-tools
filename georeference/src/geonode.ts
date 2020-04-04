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

export async function geonode(point: Coordenadas, host: string, user: string, password: string) {
    if (point) {
        const geoRef = [Number(point.lng), Number(point.lat)];
        const geoRefGK = proj4('GOOGLE', 'GAUSSKRUGGER', geoRef); // geo-referencia en coordenadas gauss-krüger
        const geoBox = (geoRefGK[0] - 10) + ',' + (geoRefGK[1] - 10) + ',' + (geoRefGK[0] + 10) + ',' + (geoRefGK[1] + 10);

        const auth = Buffer.from(`${user}:${password}`).toString('base64');
        const options = {
            json: true,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Basic ${auth}`,
                timeout: '2L'
            }
        };

        try {
            const params = new URLSearchParams({
                SERVICE: 'WMS',
                VERSION: '1.1.1',
                REQUEST: 'GetFeatureInfo',
                FORMAT: 'image/png',
                TRANSPARENT: 'true',
                QUERY_LAYERS: 'geonode:barrios',
                LAYERS: 'geonode:barrios',
                STYLES: 'barrios',
                FORMAT_OPTIONS: 'antialias:text',
                INFO_FORMAT: 'application/json',
                FEATURE_COUNT: '50',
                X: '50',
                Y: '50',
                SRS: 'EPSG:22182',
                WIDTH: '101',
                HEIGHT: '101',
                BBOX: geoBox
            });
            const response = await fetch(`${host}/geoserver/geonode/wms?` + params, options);
            const respuesta = await response.json();
            if (response.status === 200) {
                return respuesta;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}


/**
 * Dado un punto en el mapa devuelve el barrio correspondiente
 */

export async function getBarrio(point: Coordenadas, host: string, user: string, pass: string) {
    let response = await geonode(point, host, user, pass);
    if (response && response.features.length) {
        return response.features[0].properties.NOMBRE;
    }
    return null;
}

