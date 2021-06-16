const mongoose = require('mongoose');

import { AndesCache } from '@andes/core';
import { MongoMemoryServer } from 'mongodb-memory-server-global';
import { AndesServices } from '.';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

let mongoServer: any;
beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

test('should emit true', async (done) => {
    const AppCache = new AndesCache({ adapter: 'memory' });

    const service = new AndesServices(
        mongoose.connection,
        null,
        null,
        AppCache
    );

    mongoose.connection.collection('andes-services').insertOne({
        name: 'test',
        type: 'static-client',
        configuration: {
            hola: '$.hola'
        },
        cache: {
            key: '$.hola',
            ttl: 2
        }
    });

    const response = await service.get('test').exec({
        hola: 'mundo'
    });


    const response2 = await service.get('test').exec({
        hola: 'mundo'
    });

    const response3 = await service.get('test').exec({
        hola: 'mundo2'
    });

    expect(response.hola).toBe('mundo');
    expect(response2.hola).toBe('mundo');
    expect(response3.hola).toBe('mundo2');

    setTimeout(async () => {
        const value = await AppCache.get('andes-services-test-mundo');
        expect(value.hola).toBe('mundo');

        const value2 = await AppCache.get('andes-services-test-mundo2');
        expect(value2.hola).toBe('mundo2');
        done();
    });

});
