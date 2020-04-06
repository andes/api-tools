import { IPaciente, IDireccion, IUbicacion } from './IPaciente';
import { soapRequest, RenaperConfig } from './soap-client';


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

export async function status(config: RenaperConfig) {
    const persona = {
        documento: '30643636',
        sexo: 'femenino'
    };
    const soapResp = await soapRequest(persona, config);
    return (soapResp.Resultado['$value'] ? true : false);
}
