import { IDireccion, IUbicacion } from './IPaciente';
import { soapRequest, RenaperConfig } from './soap-client';
const fetch = require('node-fetch');

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
        if (datos && (datos.nombres !== '') && (datos.apellido !== '')) {
            datos.documento = persona.documento;
            datos.sexo = persona.sexo;
            return formatter ? formatter(datos) : datos;
        }
    }
    return null;

}

/**
 * Recupera los datos de una persona de renaper a través del Xroad. Espera documento y sexo.
 * @param {object} persona Datos de la persona a verificar
 * @param {function} formatter Función para transformar los datos.
 */
export interface XRoadConfig {
    securityServer: string;
    client:
    {
        xRoadInstance: string,
        memberClass: string,
        memberCode: string,
        subsystemCode: string
    };
}

export async function renaperv2(persona: any, config: XRoadConfig, formatter: (persona: any) => any = null) {
    const sexo = persona.sexo === 'masculino' ? 'M' : 'F';
    const url = `${config.securityServer}/r1/roksnet/GOV/71111229/GP-RENAPER/WS_Renaper_Documento_3/${persona.documento}/${persona.sexo}`;
    const headers = {
        'Content-type': 'application/json',
        'X-Road-Client': `${config.client.xRoadInstance}/${config.client.memberClass}/${config.client.memberCode}/${config.client.subsystemCode}`,
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        const body = await response.json();
        const datos = body.resultado1;
        if (datos && (datos.nombres !== '') && (datos.apellido !== '')) {
            datos.documento = persona.documento;
            datos.sexo = sexo;
            return formatter ? formatter(datos) : datos;
        }
        return null;
    } catch (err) {
        return null;
    }

}

export interface BusConfig {
    host: string;
    usuario: string;
    clave: string;
    dominio: string;
}

export async function renaperv3(persona: any, config: BusConfig, formatter: (persona: any) => any = null) {
    const idSexo = persona.sexo === 'masculino' ? 2 : persona.sexo === 'femenino' ? 1 : 3; // 3: sexo no binario

    // Se obtiene el token
    const token = await getToken(config.host, config.usuario, config.clave, config.dominio);
    const url = `${config.host}/personas/renaper?nroDocumento=${persona.documento}&idSexo=${idSexo.toString()}`;
    try {
        if (token) {
            const headers = {
                token,
                codDominio: config.dominio
            };
            const response = await fetch(url, {
                method: 'GET',
                headers
            });
            if (response.status === 200) {
                const datos = await response.json();
                if (datos && (datos.nombres !== '') && (datos.apellido !== '')) {
                    datos.documento = persona.documento;
                    datos.sexo = persona.sexo;
                    return formatter ? formatter(datos) : datos;
                }
            }
            return null;
        }
    } catch (err) {
        return null;
    }

}

/**
 * Transforma los datos de Renaper al formato ANDES
 */
export function renaperToAndes(ciudadano: any) {
    let paciente: any = {};
    paciente.documento = ciudadano.documento || '';
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
    paciente.sexo = ciudadano.sexo || '';
    paciente.genero = ciudadano.sexo || '';
    const fecha = ciudadano.fechaNacimiento ? ciudadano.fechaNacimiento.split('-') : null;
    paciente.fechaNacimiento = (fecha && new Date(fecha[0], fecha[1] - 1, fecha[2]) || null);
    const fechaFallecido = ciudadano.mensaf && ciudadano.mensaf === 'FALLECIDO' ? ciudadano.fechaf.split('-') : null;
    paciente.fechaFallecimiento = fechaFallecido && new Date(fechaFallecido[0], fechaFallecido[1] - 1, fechaFallecido[2]) || null;
    paciente.foto = ciudadano.foto;
    paciente.estado = 'validado';
    paciente.identificadores = [{
        entidad: 'RENAPER',
        valor: ciudadano.idtramiteprincipal || ''
    }];
    paciente.idTramite = ciudadano.idtramiteprincipal || '';
    return paciente;
}

export async function status(config: BusConfig) {
    const persona = {
        documento: '30643636',
        sexo: 'femenino'
    };
    const renaperResp = await renaperv3(persona, config);
    return (renaperResp && renaperResp.numeroDocumento ? true : false);
}

export async function getToken(host: string, usuario: string, pass: string, dominio: string) {
    const url = `${host}/usuarios/aplicacion/login`;
    const formData = JSON.stringify({
        nombre: usuario,
        clave: pass,
        codDominio: dominio
    });
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: formData,
        json: true,
    };
    const response = await fetch(
        url,
        options
    );
    const datos = await response.json();
    return datos.token || null;
}
