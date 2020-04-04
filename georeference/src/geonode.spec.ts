import * as geoNodeModule from './geonode';
const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
jest.mock('node-fetch');


describe('Geonode - Test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('geonode success', async () => {
        const p1 = {
            lat: -38.951643,
            lng: -68.059181
        };
        const res = { a: 1, status: 200 };
        const init = { status: 200 };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(res), init)));
        const response = await geoNodeModule.geonode(p1, 'host', 'user', 'secret');
        fetch.call({ url: '', options: {} });
        expect(fetch).toHaveBeenCalled();
        expect(response).toEqual(res);
        jest.restoreAllMocks();
    });

    test('fail must return null', async () => {
        const p1 = {
            lat: -38.951643,
            lng: -68.059181
        };
        const res = { a: 1, status: 400 };
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(res), { status: 400 })));
        const response = await geoNodeModule.geonode(p1, 'host', 'user', 'secret');
        fetch.call({ url: {}, options: {} });
        expect(fetch).toHaveBeenCalled();
        expect(response).toEqual(null);
        jest.restoreAllMocks();
    });


    test('getBarrio success', async () => {
        const p1 = {
            lat: -38.951643,
            lng: -68.059181
        };
        const res = { features: [{ properties: { NOMBRE: 'BARRIO SUR' } }] };
        const spyNode = jest
            .spyOn(geoNodeModule, 'geonode')
            .mockResolvedValue(() => res);
        spyNode.call(p1, 'host', 'andes', 'secret');
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(res), { status: 200 })));
        const response = await geoNodeModule.getBarrio(p1, 'host', 'andes', 'secret');
        expect(response).toEqual('BARRIO SUR');
    });


    test('getBarrio fail must return null', async () => {
        const p1 = {
            lat: -38.951643,
            lng: -68.059181
        };
        const lista: any[] = [];
        const res = { features: lista };
        const spyNode = jest
            .spyOn(geoNodeModule, 'geonode')
            .mockImplementation(() => res);
        fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(res), { status: 200 })));
        const response = await geoNodeModule.getBarrio(p1, 'host', 'andes', 'secret');
        spyNode.call(p1, 'host', 'andes', 'secret');
        expect(response).toEqual(null);
    });
});

