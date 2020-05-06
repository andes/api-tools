import * as soap from 'soap';

export interface RenaperConfig {
    url: string;
    usuario: String;
    password: String;
    server: string;
}

export async function soapRequest(persona: any, config: RenaperConfig) {
    let sexoPersona = ((typeof persona.sexo === 'string')) ? persona.sexo : (Object(persona.sexo).id);
    const sexo = sexoPersona === 'masculino' ? 'M' : 'F';
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
