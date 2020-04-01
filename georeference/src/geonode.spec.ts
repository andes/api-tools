import * as geoNodeModule from './geonode';
import * as request from './request';


test('geonode success', async () => {
    const p1 = {
        lat: -38.951643,
        lng: -68.059181
    };
    const res = { a: 1 };
    const spyRequest = jest
        .spyOn(request, 'requestHttp')
        .mockImplementation(() => [200, res]);
    const response = await geoNodeModule.geonode(p1, 'host', 'user', 'secret');

    spyRequest.call({ url: {}, qs: {}, json: true });
    expect(response).toEqual(res);
    jest.clearAllMocks();

});

test('fail must return null', async () => {
    const p1 = {
        lat: -38.951643,
        lng: -68.059181
    };

    const res = { a: 1 };
    const spyRequest = jest
        .spyOn(request, 'requestHttp')
        .mockImplementation(() => [400, res]);
    const response = await geoNodeModule.geonode(p1, 'host', 'user', 'secret');
    spyRequest.call({ url: {}, qs: {}, json: true });

    expect(response).toEqual(null);
    jest.clearAllMocks();
});


test('getBarrio success', async () => {
    const p1 = {
        lat: -38.951643,
        lng: -68.059181
    };

    const res = { features: [{ properties: { NOMBRE: 'BARRIO SUR' } }] };
    const spyNode = jest
        .spyOn(geoNodeModule, 'geonode')
        .mockImplementation(() => res);
    const response = await geoNodeModule.getBarrio(p1);

    spyNode.call(p1);
    expect(response).toEqual('BARRIO SUR');
    jest.clearAllMocks();
});


test('getBarrio fail must return null', async () => {
    const p1 = {
        lat: -38.951643,
        lng: -68.059181
    };

    const res = { features: [] };
    const spyNode = jest
        .spyOn(geoNodeModule, 'geonode')
        .mockImplementation(() => res);
    const response = await geoNodeModule.getBarrio(p1);

    spyNode.call(p1);
    expect(response).toEqual(null);
    jest.clearAllMocks();
});
