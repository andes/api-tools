import { geoReferenciar } from './geocode';
import * as geocodeModule from './geocode';
import * as request from './request';

test('success but no descriptions returns []', async () => {
    jest.mock('./request', () => ({
        requestHttp: jest.fn((callback) => callback([200, { status: 'OK', predictions: [] }]))
    }));
    const response = await geocodeModule.autocompletarDireccion('avenida siempre viva 123', 'Key');
    expect(response).toHaveLength(0);
    jest.restoreAllMocks();
});

test('success with descriptions', async () => {
    const spyRequest = jest
        .spyOn(request, 'requestHttp')
        .mockImplementation(() => [200, { status: 'OK', predictions: [{ description: 'HOLA' }] }]);
    const response = await geocodeModule.autocompletarDireccion('avenida siempre viva 123', 'key');
    expect(spyRequest).toHaveBeenCalled();
    expect(response).toHaveLength(1);
    expect(response[0]).toEqual('HOLA');
    jest.restoreAllMocks();
});

test('get georeferencia', () => {
    const resultado = [200, {
        status: 'OK',
        results: [{
            address_components:
                [{ long_name: 'Neuquén', short_name: 'Neuquén', types: ['locality', 'political'] }],
            geometry: { location: { lat: -38.9326874, lng: -68.0716869 } }
        }]
    }];
    const spyRequest = jest
        .spyOn(request, 'requestHttp')
        .mockImplementation(() => resultado);

    const geoKey = 'key';
    const geoRef = geoReferenciar('las amapolas 92, neuquen, neuquen', geoKey);
    geoRef.then(value => {
        expect(value).toEqual({ lat: -38.9326874, lng: -68.0716869 });
    });
    expect(spyRequest).toHaveBeenCalled();
    jest.restoreAllMocks();
});

