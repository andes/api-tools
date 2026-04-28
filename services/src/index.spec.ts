const mongoose = require('mongoose');
const { TextEncoder, TextDecoder } = require('util');

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import { AndesCache } from '@andes/core';
import { AndesServices } from '.';
const { MongoMemoryServer } = require('mongodb-memory-server-global');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

let mongoServer: any;
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
        binary: { version: '7.0.24' },
        instance: { storageEngine: 'wiredTiger' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
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

    await mongoose.connection.collection('andes-services').insertOne({
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

// test('should emit true 2', async (done) => {
//     const AppCache = new AndesCache({ adapter: 'memory' });

//     const service = new AndesServices(
//         mongoose.connection,
//         null,
//         null,
//         AppCache
//     );

//     mongoose.connection.collection('andes-services').insertOne({
//         name: 'test-2',
//         type: 'email-client',
//         configuration: {
//             server: {
//                 host: 'host.server.com,
//                 port: 25
//             },
//             to: 'a@a.com',
//             from: 'ANDES <gato@gmail.com>',
//             subject: 'HOLA',
//             html: '<b>hola</b>'
//         }
//     });

//     await service.get('test-2').exec();
//     done();
// });
