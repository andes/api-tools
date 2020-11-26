
import { renaper, renaperv2, status } from './query-renaper';
import * as soapConn from './soap-client';
const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');


describe('service renaper basic query', () => {

    test('renaper query success', async () => {
        const persona = { documento: '32588311', sexo: 'masculino' };

        const config: soapConn.RenaperConfig = {
            usuario: 'user',
            password: 'pass',
            server: 'http://autoriza:8080/scripts/autorizacion.exe/wsdl/IAutorizacion',
            url: 'http://autentica:8080/scripts/autenticacion.exe/wsdl/IAutenticacion'
        };
        const resultado = {
            ID_TRAMITE_PRINCIPAL: 454550023,
            ID_TRAMITE_TARJETA_REIMPRESA: 0,
            EJEMPLAR: 'C',
            VENCIMIENTO: '02/09/2031',
            EMISION: '02/09/2016',
            apellido: 'ANDES',
            nombres: 'TEST',
            fechaNacimiento: '1990-09-21',
            cuil: '',
            calle: 'Prueba',
            numero: '985',
            piso: '5'
        };

        const buffer = Buffer.from(JSON.stringify(resultado));
        const res = { Resultado: { $value: buffer } };
        const spySoap = jest
            .spyOn(soapConn, 'soapRequest')
            .mockImplementation(() => res);
        const ciudadano = await renaper(persona, config);
        expect(spySoap).toHaveBeenCalled();
        expect(spySoap).toHaveBeenCalledWith(persona, config);
        expect(ciudadano.apellido).toBe('ANDES');
        spySoap.mockReset();

    });

    test('renaper v2 query success', async () => {
        const config = {
            securityServer: 'http://prueba',
            client:
            {
                xRoadInstance: 'roksnet',
                memberClass: 'GOV',
                memberCode: '70000000',
                subsystemCode: 'GP-SALUD'
            }
        };
        const respuesta = {
            ID_TRAMITE_PRINCIPAL: 454550023,
            ID_TRAMITE_TARJETA_REIMPRESA: 0,
            EJEMPLAR: 'C',
            VENCIMIENTO: '02/09/2031',
            EMISION: '02/09/2016',
            apellido: 'ANDES',
            nombres: 'TEST',
            fechaNacimiento: '1990-09-21',
            cuil: '',
            calle: 'Prueba',
            numero: '985',
            piso: '5'
        };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(respuesta))));
        await renaperv2({ documento: '32588311', sexo: 'M' }, config);
        expect(fetch).toHaveBeenCalled();
        expect(fetch.mock.calls).toMatchSnapshot();
    });

    test('renaper query not found', async () => {
        const persona = { documento: '11', sexo: 'masculino' };

        const config: soapConn.RenaperConfig = {
            usuario: 'user',
            password: 'pass',
            server: 'http://autoriza:8080/scripts/autorizacion.exe/wsdl/IAutorizacion',
            url: 'http://autentica:8080/scripts/autenticacion.exe/wsdl/IAutenticacion'
        };
        const res = { Resultado: {} };
        const spySoap = jest
            .spyOn(soapConn, 'soapRequest')
            .mockImplementation(() => res);
        const ciudadano = await renaper(persona, config);
        expect(spySoap).toHaveBeenCalled();
        expect(spySoap).toHaveBeenCalledWith(persona, config);
        expect(ciudadano).toBe(null);
        spySoap.mockReset();

    });

    test('renaper status success', async () => {
        const config: soapConn.RenaperConfig = {
            usuario: 'user',
            password: 'pass',
            server: 'http://autoriza:8080/scripts/autorizacion.exe/wsdl/IAutorizacion',
            url: 'http://autentica:8080/scripts/autenticacion.exe/wsdl/IAutenticacion'
        };
        const buffer = Buffer.from(JSON.stringify({ documento: '12345', sexo: 'F' }));
        const res = { Resultado: { $value: buffer } };
        const spySoap = jest
            .spyOn(soapConn, 'soapRequest')
            .mockImplementation(() => res);
        const estado = await status(config);
        expect(spySoap).toHaveBeenCalled();
        expect(estado).toBe(true);
        spySoap.mockReset();
    });

});
