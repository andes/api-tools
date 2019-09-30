const mongoose = require('mongoose');
import { MongoMemoryServer } from 'mongodb-memory-server-global';
import { ResourceBase } from './index';
import { MongoQuery } from '../query-builder/in-mongo';

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
        PersonaModel = mongoose.model('personas', schema);

        class Personas extends ResourceBase {
            Model = PersonaModel;
            searchFileds = {
                active: (b: any) => b,
                nombre: (text: string) => new RegExp(`^${text}`)
            };
        }
        personaResource = new Personas({});
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
            ]
        });
        PersonaModel = mongoose.model('personas_search', schema);

        class Personas extends ResourceBase {
            Model = PersonaModel;
            searchFileds = {
                active: (b: any) => b,
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
                }
            };
        }
        personaResource = new Personas({});
        await personaResource.create({
            nombre: 'Carlos Perez',
            active: true,
            direccion: [
                { tipo: 'laboral', calle: 'Santa Fe 670' }
            ]
        }, {} as any);
        await personaResource.create({ nombre: 'Miguel Perez', active: true }, {} as any);
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
});
