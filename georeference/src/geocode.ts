import { Coordenadas } from './index';
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

function removeSpecialCharacter(cadena: string) {
    cadena = cadena.replace(/ /g, '+');
    cadena = cadena.replace(/á/gi, 'a');
    cadena = cadena.replace(/é/gi, 'e');
    cadena = cadena.replace(/í/gi, 'i');
    cadena = cadena.replace(/ó/gi, 'o');
    cadena = cadena.replace(/ú/gi, 'u');
    cadena = cadena.replace(/ü/gi, 'u');
    cadena = cadena.replace(/ñ/gi, 'n');

    return cadena;
}

/**
 *
 * @param texto para autocompletar
 * @returns opciones
 */
export async function autocompletarDireccion(texto: string, API_KEY: string) {
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?';
    const params = new URLSearchParams({
        input: texto,
        types: 'address',
        components: 'country:ar',
        language: 'es',
        key: API_KEY
    });
    try {
        const response = await fetch(url + params, { json: true });
        if (response.status === 200) {
            const body = await response.json();
            let predicciones = body.predictions.map((elem: any) => elem.description);
            return predicciones;
        } else {
            return [];
        }
    } catch (err) {
        return [];
    }
}

/**
 * Obtiene la localidad de una direccion con formato "calle, localidad, provincia"
 */
function matchLocalidad(direccion: string) {
    const arrDireccion = direccion.split(','); // Se separa lo que se encuentre entre comas
    return removeSpecialCharacter(arrDireccion[1].trim());  // se obtiene la localidad y se formatea
}

/**
 *
 * @param direccion: String. Direccióncon formato << domicilio, localidad, provincia >>.
 * @returns coordenadas: { latitud, longitud } en caso de éxito. De lo contrario null.
 */
export async function geoReferenciar(direccion: string, API_KEY: string) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json?';
    const params = new URLSearchParams({
        address: removeSpecialCharacter(direccion) + ',+AR',
        key: API_KEY
    });
    const options = { json: true };
    try {
        const response: any = await fetch(url + params, options);
        if (response.status === 200) {
            const body = await response.json();
            const localidadBuscada = matchLocalidad(direccion);
            let coordenadas: Coordenadas;
            for (let elemento of body.results) {
                let localidad = elemento.address_components.find((atributo: any) => atributo.types[0] === 'locality');
                if (localidad) {
                    localidad = removeSpecialCharacter(localidad.short_name);
                    if (localidad.toUpperCase() === localidadBuscada.toUpperCase()) {
                        coordenadas = elemento.geometry.location;
                        break;
                    }
                }
            }
            return coordenadas;
        } else {
            return null;
        }
    } catch (err) {
        return null;
    }
}
