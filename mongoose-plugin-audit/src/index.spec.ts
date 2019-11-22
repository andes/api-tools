const mongoose = require('mongoose');

import { AuditPlugin, AuditDocument } from './index';
import { MongoMemoryServer } from 'mongodb-memory-server-global';

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

test('should emit true', () => {

    const schema = new mongoose.Schema({});
    schema.plugin(AuditPlugin);
    const Model = mongoose.model('prueba2', schema);
    const m = new Model({});
    expect(typeof (m as any).audit).toBe('function');

});

test('should store createdAt field', async () => {
    const schema = new mongoose.Schema({ documento: String });
    schema.plugin(AuditPlugin);
    const Model = mongoose.model('prueba', schema);
    const m = new Model({ documento: '1010' });
    m.audit({ user: { usuario: { documento: '123456' } } });

    await m.save();

    const savedModel: any = await Model.findById(m._id);
    expect(savedModel.createdAt).toBeDefined();
    expect(savedModel.createdBy.documento).toBe('123456');

    m.documento = 'asdasd';
    m.audit({ user: { usuario: { documento: '123456' } } });
    await m.save();

    const savedModel2: any = await Model.findById(m._id);
    expect(savedModel2.updatedAt).toBeDefined();
    expect(savedModel2.updatedBy.documento).toBe('123456');


});


test('AuditDocument test', () => {

    const documento: any = { nombre: 'JUAN' };
    const user: any = { usuario: { nombre: 'PEDRO' }, organizacion: { nombre: 'CASTRO' } };
    AuditDocument(documento, user);

    expect(documento.createdAt).toBeDefined();
    expect(documento.createdBy.nombre).toBe('PEDRO');
    expect(documento.updatedAt).toBeUndefined();

    AuditDocument(documento, user);
    expect(documento.updatedAt).toBeDefined();
    expect(documento.updatedBy.nombre).toBe('PEDRO');


});
