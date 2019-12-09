
import { ApiBootstrap } from './index';

const request = require('supertest');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;


describe('bootstrap api - basic test', () => {
    it('version test', () => {
        const application = new ApiBootstrap({ name: 'HOLA', version: '1.1.1' });
        const app = application.start();
        request(app)
            .get('/version')
            .expect(200)
            .then((response: any) => {
                expect(response.body.name).toBe('HOLA');
                expect(response.body.version).toBe('1.1.1');
            });

        application.stop();
    });

    it('alive test', () => {
        const application = new ApiBootstrap({ name: 'HOLA', version: '1.1.1' });
        const app = application.start();
        request(app)
            .get('/alive')
            .expect(200)
            .then((response: any) => {
                expect(response.body.status).toBe('OK');
            });

        application.stop();
    });

});

describe('bootstrap api - routing', () => {
    let application: ApiBootstrap, expressApp: Express.Application;

    beforeAll(() => {
        application = new ApiBootstrap({ name: 'HOLA', version: '1.1.1' });

        const router = application.router();
        router.get('/test', (req, res, next) => {
            res.json({ status: 'ok' });
        });

        router.get('/test/bool', (req, res, next) => {
            res.json({ status: req.query.bool });
        });

        router.get('/fail', (req, res, next) => {
            res.status(500).json({ status: 'error' });
        });

        router.get('/fail/throw', (req, res, next) => {
            return next(new Error('hola'));
        });

        router.get('/fail/422', (req, res, next) => {
            const error: any = new Error('hola');
            error.status = 422;
            return next(error);
        });

        router.get('/fail/422', (req, res, next) => {
            const error: any = new Error('hola');
            error.status = 422;
            return next(error);
        });

        router.get('/fail/with/string', (req, res, next) => {
            return next('ERROR');
        });

        application.add(router);
        application.add({ path: '/api', router });
        expressApp = application.start();
    });

    afterAll(() => {
        application.stop();
    });

    it('basic routing', () => {
        return request(expressApp)
            .get('/test')
            .expect(200)
            .then((response: any) => {
                expect(response.body.status).toBe('ok');
            }).catch(() => { expect(true).toBe(false); });
    });

    it('bool casting', () => {
        return request(expressApp)
            .get('/test/bool?bool=true')
            .expect(200)
            .then((response: any) => {
                expect(response.body.status).toBe(true);
            }).catch(() => { expect(true).toBe(false); });
    });

    it('routing config under path', () => {
        return request(expressApp)
            .get('/api/test')
            .expect(200)
            .then((response: any) => {
                expect(response.body.status).toBe('ok');
            }).catch(() => { expect(true).toBe(false); });
    });

    it('fail error', () => {
        return request(expressApp).get('/fail/throw').expect(500);
    });

    it('fail error 422', () => {
        return request(expressApp).get('/fail/422').expect(422).then((response: any) => {
            expect(response.body.message).toBe('hola');
        });
    });

    it('fail with error', () => {
        return request(expressApp).get('/fail/with/string').expect(400).then((response: any) => {
            expect(response.body.message).toBe('ERROR');
        });
    });
});


describe('bootstrap api - auth', () => {
    let application: ApiBootstrap, expressApp: Express.Application;

    beforeAll(() => {
        application = new ApiBootstrap({ name: 'HOLA', version: '1.1.1' }, { key: '8XOcgoMojZE4CwhluNkM9FtwzCfUPJWhf7/XGYizQVw=' });

        const router = application.router();
        router.get('/auth', application.authenticate(), (req: any, res: any, next: any) => {
            res.json(req.user);
        });

        router.get('/optional', application.optional(), (req: any, res: any, next: any) => {
            res.json(req.user);
        });

        application.add(router);
        expressApp = application.start();
    });

    afterAll(() => {
        application.stop();
    });

    it('session', async () => {
        const token = await application.sign({ user: 1 });
        return request(expressApp).get('/session?token=' + token).expect(200).then((response: any) => {
            expect(response.body.user).toBe(1);
        });
    });

    it('unauthorized', () => {
        return request(expressApp).get('/auth').expect(401);
    });

    it('authorized by query', async () => {
        const token = await application.sign({ user: 1 });
        return request(expressApp).get('/auth?token=' + token).expect(200);
    });

    it('authorized by header', async () => {
        const token = await application.sign({ user: 1 });
        return request(expressApp).get('/auth').set('Authorization', 'JWT ' + token).expect(200).then((response: any) => {
            expect(response.body.user).toBe(1);
        });
    });

    it('optional auth', async () => {
        const token = await application.sign({ user: 1 });
        return request(expressApp).get('/optional').set('Authorization', 'JWT ' + token).expect(200).then((response: any) => {
            expect(response.body.user).toBe(1);
        });
    });

    it('optional without token', async () => {
        return request(expressApp).get('/optional').expect(200).then((response: any) => {
            expect(response.body.user).toBeUndefined();
        });
    });

    it('optional without token', async (done) => {
        const token = await application.sign({ user: 1 }, 1);
        setTimeout(() => {
            return request(expressApp).get('/auth').set('Authorization', 'JWT ' + token).expect(401)
                .then((response: any) => {
                    done();
                });
        }, 3000);
    });

});
