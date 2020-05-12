import { IDireccion, IUbicacion } from './IPaciente';
import { soapRequest, RenaperConfig } from './soap-client';

/**
 * Recupera los datos de una persona de renaper. Espera documento y sexo.
 * @param {object} persona Datos de la persona a verificar
 * @param {function} formatter Función para transformar los datos.
 */

export async function renaper(persona: any, config: RenaperConfig, formatter: (persona: any) => any = null) {
    const soapResp = await soapRequest(persona, config);
    if (soapResp && soapResp.Resultado['$value']) {
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
    let paciente: any = {};
    paciente.nombre = ciudadano.nombres || '';
    paciente.apellido = ciudadano.apellido || '';
    paciente.cuil = ciudadano.cuil || '';

    // Se arma un objeto de dirección
    let ubicacion: IUbicacion = {
        localidad: { nombre: ciudadano.ciudad || '' },
        provincia: { nombre: ciudadano.provincia || '' },
        pais: { nombre: ciudadano.paisNacimiento || 'Argentina' },  // Ver el pais de la ubicación
        barrio: null
    };

    let domicilio: IDireccion = {
        valor: '',
        codigoPostal: ciudadano.cpostal || '',
        ranking: 1,
        activo: true,
        ubicacion,
        ultimaActualizacion: new Date()
    };
    if (ciudadano.calle) {
        domicilio.valor += `${ciudadano.calle} ${ciudadano.numero}`;
        if (ciudadano.piso) {
            domicilio.valor += ` ${ciudadano.piso} ${ciudadano.departamento}`;
        }
    }

    paciente.direccion = [domicilio];
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
    return (soapResp && soapResp.Resultado['$value'] ? true : false);
}
