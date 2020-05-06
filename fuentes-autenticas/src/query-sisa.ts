// import { to_json } from 'xmljson';
import { IPaciente, IDireccion, IUbicacion } from './IPaciente';
const fetch = require('node-fetch');
const convert = require('xmljson');

interface IConfig {
    username: String;
    password: String;
    host: String;
    port: Number;
    url: String;
}

async function xmlToJson(xml: any) {
    return new Promise((resolve, reject) => {
        convert.to_json(xml, (error: any, data: JSON) => {
            return error ? reject(error) : resolve(data);
        });
    });
}

/**
 * Busca en SISA un ciudadano según Documento y sexo
 *  Parámetros de la llamada
    Usuario: usuario
    Clave: clave
    Número de documento: nrodoc
    Código SISA: codigo
    Sexo: sexo
 */
export async function sisa(persona: any, config: any, formatter: any = null) {
    let sexoPersona = ((typeof persona.sexo === 'string')) ? persona.sexo : (Object(persona.sexo).id);
    const sexo = sexoPersona === 'masculino' ? 'M' : 'F';
    const documento = persona.documento;
    const autenticacion = `usuario=${config.username}&clave=${config.password}`;
    const url = `${config.url}nrodoc=${documento}&sexo=${sexo}&${autenticacion}`;
    let response = await fetch(url);
    if (response.status >= 200 && response.status < 400) {
        let data = await response.text();
        const resp: any = await xmlToJson(data);
        if (resp.Ciudadano && resp.Ciudadano.resultado === 'OK') {
            return formatter ? formatter(resp.Ciudadano) : resp.Ciudadano;
        }
    }
    return null;
}

/**
 * Formatea un Ciudadano SISA al schema de ANDES.
 */

export function sisaToAndes(ciudadano: any) {
    let paciente: IPaciente;
    paciente.documento = ciudadano.nroDocumento || '';
    paciente.nombre = ciudadano.nombre || '';
    paciente.apellido = ciudadano.apellido || '';

    // Se arma un objeto de dirección
    paciente.direccion = [];
    let domicilio: IDireccion;

    domicilio.valor = ciudadano.domicilio ? (ciudadano.pisoDpto && ciudadano.pisoDpto !== '0 0' ? `${ciudadano.domicilio} ${ciudadano.pisoDpto}` : ciudadano.domicilio) : '';
    domicilio.codigoPostal = ciudadano.codigoPostal || '';

    let ubicacion: IUbicacion;
    ubicacion.localidad.nombre = ciudadano.localidad || '';
    ubicacion.provincia.nombre = ciudadano.provincia || '';

    domicilio.ranking = 1;
    domicilio.activo = true;
    domicilio.ubicacion = ubicacion;
    paciente.direccion.push(domicilio);
    paciente.sexo = ciudadano.sexo && ciudadano.sexo === 'F' ? 'femenino' : 'masculino';
    paciente.genero = ciudadano.sexo && ciudadano.sexo === 'F' ? 'femenino' : 'masculino';
    const fecha = ciudadano.fechaNacimiento ? ciudadano.fechaNacimiento.split('-') : null;
    paciente.fechaNacimiento = (fecha && new Date(fecha[2].substr(0, 4), fecha[1] - 1, fecha[0]) || null);
    const fechaFallecido = ciudadano.fallecido !== 'NO' ? ciudadano.fechaFallecimiento.split('-') : null;
    paciente.fechaFallecimiento = fechaFallecido && new Date(fecha[2].substr(0, 4), fecha[1], fecha[0]) || null;

    paciente.identificadores = [{
        entidad: 'SISA',
        valor: ciudadano.codigoSISA
    }];
    return paciente;
}

/**
 * Devuelve la orferta prestacional de sisa
 */
export async function sisaPrestaciones(orgCodSisa: string, config: IConfig) {
    const url = `${config.host}/sisa/services/rest/establecimiento/prestaciones/${orgCodSisa}`;
    const options = {
        method: 'POST',
        body: JSON.stringify({
            usuario: config.username,
            clave: config.password
        }),
        json: true,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    };
    const response = await fetch(url, options);
    if (response.status >= 200 && response.status < 400) {
        const data = await response.json();
        const { resultado, prestaciones } = data;
        if (resultado === 'OK') {
            return prestaciones;
        }
    }
    return [];
}


/**
 * Devuelve los datos de una organización de SISA
 */
export async function sisaOrganizacion(orgCodSisa: string, config: IConfig) {
    const url = `${config.host}/sisa/services/rest/establecimiento/${orgCodSisa}`;
    const options = {
        method: 'POST',
        body: JSON.stringify({
            usuario: config.username,
            clave: config.password
        }),
        json: true,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    };
    const response = await fetch(url, options);
    if (response.status >= 200 && response.status < 400) {
        const data = await response.json();
        const { resultado } = data;
        if (resultado === 'OK') {
            return data;
        }
    }
    return null;
}

export async function checkStatus(url: string) {
    const res = await fetch(url);
    const { status } = res;
    return status;
}
