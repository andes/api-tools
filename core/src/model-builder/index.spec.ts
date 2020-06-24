const mongoose = require('mongoose');
const bodyParser = require('body-parser');

import { MongoMemoryServer } from 'mongodb-memory-server-global';
import { ResourceBase } from './index';
import { MongoQuery } from '../query-builder/in-mongo';
import { apiOptionsMiddleware } from '@andes/api-tool';

import { Document } from 'mongoose';

const request = require('supertest');
const express = require('express');

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

describe('ReouserBase basic operation', () => {
    let PersonaModel: any;
    let personaResource: any;

    beforeAll(async () => {
        const schema = new mongoose.Schema({ nombre: String, active: Boolean });
        interface IPersona extends Document {
            nombre: String;
            active: Boolean;
        }
        PersonaModel = mongoose.model('personas', schema);


        class Personas extends ResourceBase<IPersona> {
            Model = PersonaModel;
            searchFileds = {
                active: (b: any) => b,
                nombre: (text: string) => new RegExp(`^${text}`)
            };
        }
        personaResource = new Personas();
    });


    test('create document', async () => {
        const m = await personaResource.create({ nombre: 'Carlos Perez', active: true }, {} as any);

        const savedModel: any = await PersonaModel.findById(m._id);
        expect(m.nombre).toBe(savedModel.nombre);
    });

    test('findById document', async () => {
        const m = await personaResource.create({ nombre: 'Gardel', active: false }, {} as any);

        const m2 = await personaResource.findById(m._id, {});
        expect(m.nombre).toBe(m2.nombre);

        const m3 = await personaResource.findById(m._id, { fields: '-nombre' });
        expect(m3.nombre).toBeUndefined();
    });

    test('search string exactly', async () => {
        let search = await personaResource.search({ nombre: 'Carlos' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('search string exactly with out result', async () => {
        let search = await personaResource.search({ nombre: 'ACarlos' }, {}, {} as any);
        expect(search).toHaveLength(0);

    });

    test('search with two filters', async () => {
        let search = await personaResource.search({ nombre: 'Carlos', active: true }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('remove document', async () => {
        const m = await personaResource.create({ nombre: 'Gardel2', active: false }, {} as any);
        await personaResource.remove(m._id);
        const notFound: any = await PersonaModel.findById(m._id);
        expect(notFound).toBeNull();
    });
});

describe('ReouserBase searching', () => {
    let PersonaModel: any;
    let personaResource: any;

    beforeAll(async () => {
        const schema = new mongoose.Schema({
            nombre: String,
            active: Boolean,
            direccion: [
                { tipo: String, calle: String }
            ],
            fechaNacimiento: Date
        });
        PersonaModel = mongoose.model('personas_search', schema);

        class Personas extends ResourceBase {
            Model = PersonaModel;
            searchFileds = {
                active: MongoQuery.equalMatch,
                nombre: MongoQuery.partialString,
                laboral: (value: string) => {
                    return MongoQuery.queryArray('direccion', [`laboral|${value}`], 'tipo', 'calle');
                },
                direccion: (value: any) => {
                    return MongoQuery.queryArray('direccion', value, 'tipo', 'calle');
                },
                customField: {
                    field: 'direccion.calle',
                    fn: MongoQuery.partialString
                },
                fechaNacimiento: MongoQuery.matchDate,
                search: ['nombre', 'laboral', 'customField']
            };
        }
        personaResource = new Personas({});
        await personaResource.create({
            nombre: 'Carlos Perez',
            active: true,
            direccion: [
                { tipo: 'laboral', calle: 'Santa Fe 670' }
            ],
            fechaNacimiento: new Date('1990-09-15 13:00:00')
        }, {} as any);
        await personaResource.create({ nombre: 'Miguel Perez', active: true, fechaNacimiento: new Date('1990-08-15 13:00:00') }, {} as any);
    });

    test('search exactly without result', async () => {
        const search = await personaResource.search({ nombre: 'Carlos' }, {}, {} as any);
        expect(search).toHaveLength(0);
    });

    test('searching exactly', async () => {
        const search = await personaResource.search({ nombre: 'Carlos Perez' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching partial', async () => {
        const search = await personaResource.search({ nombre: '^Carlos' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching partial not begining', async () => {
        const search = await personaResource.search({ nombre: '^Perez' }, {}, {} as any);
        expect(search).toHaveLength(2);
    });

    test('searching lowercase', async () => {
        const search = await personaResource.search({ nombre: '^perez' }, {}, {} as any);
        expect(search).toHaveLength(2);
    });

    test('searching test', async () => {
        const search = await personaResource.search({ laboral: '^santa' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching partial no result', async () => {
        const search = await personaResource.search({ laboral: '^nada' }, {}, {} as any);
        expect(search).toHaveLength(0);
    });

    test('searching in array', async () => {
        const search = await personaResource.search({ direccion: 'laboral|^santa' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching in custom field name', async () => {
        const search = await personaResource.search({ customField: '^santa' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching with custom fields result', async () => {
        const search = await personaResource.search({ customField: '^santa' }, { fields: '-nombre' }, {} as any);
        expect(search[0].nombre).toBeUndefined();
    });

    test('searching matchDate', async () => {
        const search = await personaResource.search({ fechaNacimiento: '1990-08-01|1990-08-31' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching matchDate', async () => {
        const search = await personaResource.search({ fechaNacimiento: '1990-08-01|2019-12-20' }, {}, {} as any);
        expect(search).toHaveLength(2);
    });

    test('searching matchDate: exact date without hour', async () => {
        const search = await personaResource.search({ fechaNacimiento: '1990-08-15' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('searching matchDate: mayor a con hora', async () => {
        const search = await personaResource.search({ fechaNacimiento: '>=1990-08-15T12:00:00' }, {}, {} as any);
        expect(search).toHaveLength(2);
    });

    test('searching matchDate: menor a con hora', async () => {
        const search = await personaResource.search({ fechaNacimiento: '<1990-08-15T12:00:00' }, {}, {} as any);
        expect(search).toHaveLength(0);
    });

    test('searching matchDate: menor a con hora', async () => {
        const search = await personaResource.search({ fechaNacimiento: '<1990-08-16T12:00:00' }, {}, {} as any);
        expect(search).toHaveLength(1);
    });

    test('multisearch field', async () => {
        const search = await personaResource.search({ search: '^santa' }, {}, {} as any);
        expect(search).toHaveLength(1);

        const search2 = await personaResource.search({ search: '^carlos' }, {}, {} as any);
        expect(search2).toHaveLength(1);

        const search3 = await personaResource.search({ search: 'Santa Fe 670' }, {}, {} as any);
        expect(search3).toHaveLength(1);

        const search4 = await personaResource.search({ search: 'Perez' }, {}, {} as any);
        expect(search4).toHaveLength(0);

        const search5 = await personaResource.search({ search: '^Perez' }, {}, {} as any);
        expect(search5).toHaveLength(2);

    });

    test('sort by fechaNacimiento ASC', async () => {
        const search = await personaResource.search({}, { sort: 'fechaNacimiento' }, {} as any);
        expect(search).toHaveLength(2);
        expect(search[0].nombre).toBe('Miguel Perez');
    });

    test('sort by fechaNacimiento DESC', async () => {
        const search = await personaResource.search({}, { sort: '-fechaNacimiento' }, {} as any);
        expect(search).toHaveLength(2);
        expect(search[0].nombre).toBe('Carlos Perez');
    });
});


describe('API - Test', () => {
    let PersonaModel: any;
    let personaResource: any;
    let app: any;
    beforeAll(async () => {
        const schema = new mongoose.Schema({ nombre: String, active: Boolean });
        PersonaModel = mongoose.model('personas_api', schema);

        class Personas extends ResourceBase<any> {
            Model = PersonaModel;
            resourceName = 'personas';

            searchFileds = {
                active: (b: any) => b,
                nombre: (text: string) => text
            };

        }
        personaResource = new Personas({});

        app = express();

        const router = personaResource.makeRoutes();
        app.use(bodyParser.json({ limit: '150mb' }));
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(apiOptionsMiddleware);
        app.use('/api', router);

        app.use((err: any, req: any, res: any, next: any) => {
            if (err) {
                // Parse err
                let e: Error;
                if (!isNaN(err)) {
                    e = new Error('');
                    (e as any).status = err;
                    err = e;
                } else {
                    if (typeof err === 'string') {
                        e = new Error(err);
                        (e as any).status = 400;
                        err = e;
                    } else if (!err.status) {
                        err.status = 500;
                    }
                }

                // IMPORTANTE: Express app.get('env') returns 'development' if NODE_ENV is not defined.
                // O sea, la API está corriendo siempre en modo development

                // Send response
                res.status(err.status);
                res.send({
                    message: err.message,
                    error: (app.get('env') === 'development') ? err : null
                });
            }
        });

    });

    it('empty get', () => {
        return request(app)
            .get('/api/personas')
            .expect(200)
            .then((response: any) => {
                expect(response.body).toHaveLength(0);
            });
    });

    it('create element', () => {
        return request(app)
            .post('/api/personas')
            .send({ nombre: 'Juan', active: false })
            .set('Accept', 'application/json')
            .expect(200)
            .then(async (response: any) => {
                expect(response.body.nombre).toBe('Juan');
                const search = await personaResource.search({ nombre: 'Juan' }, {}, {} as any);
                expect(search).toHaveLength(1);
            });
    });

    it('searching api', async () => {
        await personaResource.create({ nombre: 'Perez Jorge', active: true }, {} as any);
        await personaResource.create({ nombre: 'Perez', active: false }, {} as any);

        return request(app)
            .get('/api/personas?nombre=Perez')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response: any) => {
                expect(response.body).toHaveLength(1);

            });
    });

    it('sorting api ASC', async () => {
        return request(app)
            .get('/api/personas?sort=active')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response: any) => {
                expect(response.body).toHaveLength(3);
                expect(response.body[0].nombre).toBe('Juan');
            });
    });

    it('sorting api DESC', async () => {
        return request(app)
            .get('/api/personas?sort=-active')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response: any) => {
                expect(response.body).toHaveLength(3);
                expect(response.body[0].nombre).toBe('Perez Jorge');
            });
    });

    it('delete api', async () => {
        const m: any = await personaResource.create({ nombre: 'Perez Jorge', active: true }, {} as any);

        return request(app)
            .delete('/api/personas/' + m._id)
            .set('Accept', 'application/json')
            .expect(200)
            .then(async (response: any) => {
                const mm = await personaResource.findById(m._id, {});
                expect(mm).toBeNull();
            });
    });

    it('delete api not found', async () => {
        return request(app)
            .delete('/api/personas/5d9243a87e515675833921c4')
            .set('Accept', 'application/json')
            .expect(404);
    });
});
