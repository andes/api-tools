import { sisa, sisaPrestaciones, sisaOrganizacion } from './query-sisa';
const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');

describe('service sisa basic query', () => {
    beforeAll(async () => {

    });

    test('query ciudadano sisa', async () => {
        const config = {
            username: 'user',
            password: 'pass',
            host: 'https://pruebas',
            url: 'https://obtenerciudadano?',
        };
        const ciudadano = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Ciudadano><resultado>OK</resultado>
                            <id>7032791944</id>
                            <codigoSISA>3800186896</codigoSISA>
                            <identificadoRenaper>37660519</identificadoRenaper>
                            <tipoDocumento>DNI</tipoDocumento>
                            <nroDocumento>1111111</nroDocumento>
                            <apellido>PRUEBA</apellido>
                            <nombre>ANDES</nombre>
                            <sexo>M</sexo>
                            <fechaNacimiento>21-09-1986 00:00</fechaNacimiento>
                            </Ciudadano>`;
        fetch.mockReturnValue(Promise.resolve(new Response(ciudadano)));
        const datos = await sisa({ documento: '1111111', sexo: 'M' }, config);
        expect(datos).toHaveProperty('nroDocumento');
        expect(datos).toHaveProperty('apellido');
        expect(fetch).toHaveBeenCalled();
        expect(fetch.mock.calls).toMatchSnapshot();
    });

    test('query prestaciones', async () => {
        const config = {
            username: 'user',
            password: 'pass',
            host: 'https://pruebas',
            port: 80,
            url: 'https://obtenerprestaciones?',
        };
        const prestaciones = {
            resultado: 'OK',
            codigo: '10580352167033',
            nombre: 'HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON',
            prestaciones:
                [{ id: 2, nombre: 'Alergia e inmunología', disponible: 'SI' }]
        };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(prestaciones))));
        const datos = await sisaPrestaciones('10580352167033', config);
        expect(datos).toHaveLength(1);
        expect(fetch).toHaveBeenCalled();
        expect(fetch.mock.calls).toMatchSnapshot();
    });

    test('query establecimiento', async () => {
        const config = {
            username: 'user',
            password: 'pass',
            host: 'https://pruebas',
            port: 80,
            url: 'https://obtenerprestaciones?',
        };
        const establecimiento = {
            resultado: 'OK',
            fechaRegistro: '28/08/2010',
            fechaModificacion: '25/07/2018',
            codigo: '10580352167033',
            nombre: 'HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON',
            provincia: 'Neuquén',
            codIndecProvincia: 58,
            tipologia: 'Establecimiento de salud con internación general',
            dependencia: 'Provincial'
        };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(establecimiento))));
        const datos = await sisaOrganizacion('10580352167033', config);
        expect(datos).toHaveProperty('resultado');
        expect(datos).toHaveProperty('nombre');
        expect(fetch).toHaveBeenCalled();
        expect(fetch.mock.calls).toMatchSnapshot();
    });

});
