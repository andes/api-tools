import { geoReferenciar } from './geocode';
import * as geocodeModule from './geocode';
const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
jest.mock('node-fetch');

describe('Geocode- Test', () => {
    beforeEach(() => {
        // fetchMock.resetMocks();
        jest.resetAllMocks();
    });

    test('success but no descriptions returns []', async () => {
        const resultado = { status: 200, body: { predictions: [] } };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(resultado), { status: 200 })));
        const response = await geocodeModule.autocompletarDireccion('avenida siempre viva 123', 'Key');
        expect(fetch).toHaveBeenCalled();
        expect(response).toHaveLength(0);
    });

    test('success with descriptions', async () => {
        const resultado = JSON.stringify({ status: 200, predictions: [{ description: 'HOLA' }] });
        fetch.mockReturnValue(Promise.resolve(new Response(resultado)));
        const response = await geocodeModule.autocompletarDireccion('avenida siempre viva 123', 'key');
        expect(fetch).toHaveBeenCalled();
        expect(response).toHaveLength(1);
        expect(response[0]).toEqual('HOLA');
    });

    test('get georeferencia', () => {
        const resultado = {
            status: 200,
            results: [{
                address_components:
                    [{ long_name: 'Neuquén', short_name: 'Neuquén', types: ['locality', 'political'] }],
                geometry: { location: { lat: -38.9326874, lng: -68.0716869 } }
            }]
        };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(resultado))));

        const geoKey = 'key';
        const geoRef = geoReferenciar('las amapolas 92, neuquen, neuquen', geoKey);
        geoRef.then(value => {
            expect(value).toEqual({ lat: -38.9326874, lng: -68.0716869 });
        });
        expect(fetch).toHaveBeenCalled();
    });

});



