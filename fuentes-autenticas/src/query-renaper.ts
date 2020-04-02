import * as soap from 'soap';
import { IPaciente, IDireccion, IUbicacion } from './IPaciente';

interface RenaperConfig {
    url: string;
    usuario: String;
    password: String;
    server: string;
}

async function soapRequest(persona: any, config: RenaperConfig) {
    const sexo = persona.sexo === 'masculino' ? 'M' : 'F';
    const documento = persona.documento;

    const autenticationClient = await soap.createClientAsync(config.url);
    if (autenticationClient) {
        const credenciales = {
            Usuario: config.usuario,
            password: config.password
        };
        const [session] = await autenticationClient.LoginPecasAsync(credenciales);

        if (session && session.return) {
            const args = {
                IdSesion: session.return['$value'],
                Base: 'PecasAutorizacion'
            };

            await autenticationClient.FijarBaseDeSesionAsync(args);
            const autorizationClient = await soap.createClientAsync(config.server);
            const args2 = {
                IdSesionPecas: session.return['$value'],
                Cliente: 'ANDES SISTEMA',
                Proveedor: 'GP-RENAPER',
                Servicio: 'WS_RENAPER_documento',
                DatoAuditado: `documento=${documento};sexo=${sexo}`,
                Operador: 'andes',
                Cuerpo: 'hola',
                Firma: false,
                CuerpoFirmado: false,
                CuerpoEncriptado: false
            };

            const [respuesta] = await autorizationClient.Solicitar_ServicioAsync(args2);
            if (respuesta && respuesta.return) {
                return respuesta.return;
            }
        }
    }
    return null;
}

/**
 * Recupera los datos de una persona de renaper. Espera documento y sexo.
 * @param {object} persona Datos de la persona a verificar
 * @param {function} formatter Función para transformar los datos.
 */

export async function renaper(persona: any, config: RenaperConfig, formatter: (persona: any) => any = null) {
    const soapResp = await soapRequest(persona, config);
    if (soapResp.Resultado['$value']) {
        const resultado = Buffer.from(soapResp.Resultado['$value'], 'base64').toString('utf8');
        const datos = JSON.parse(resultado);
        return formatter ? formatter(datos) : datos;
    } else {
        return null;
    }
}

/**
 * Transforma los datos de Renaper al formato ANDES
 */
export function renaperToAndes(ciudadano: any) {
    let paciente: IPaciente;
    paciente.nombre = ciudadano.nombres || '';
    paciente.apellido = ciudadano.apellido || '';
    paciente.cuil = ciudadano.cuil || '';

    // Se arma un objeto de dirección
    paciente.direccion = [];
    let domicilio: IDireccion;
    domicilio.valor = '';
    if (ciudadano.calle) {
        domicilio.valor += `${ciudadano.calle} ${ciudadano.numero}`;
        if (ciudadano.piso) {
            domicilio.valor += ` ${ciudadano.piso} ${ciudadano.departamento}`;
        }
    }
    domicilio.codigoPostal = ciudadano.cpostal || '';

    let ubicacion: IUbicacion;
    ubicacion.pais.nombre = ciudadano.pais || 'Argentina';
    ubicacion.localidad.nombre = ciudadano.ciudad || '';
    ubicacion.provincia.nombre = ciudadano.provincia || '';

    // Ver el pais de la ubicación
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

    paciente.foto = ciudadano.foto;
    paciente.identificadores = [{
        entidad: 'RENAPER',
        valor: ciudadano.idciudadano
    }];
    return paciente;
}


export async function status(url: string) {
    const autenticationClient = await soap.createClientAsync(url);
    return autenticationClient ? true : false;
}
