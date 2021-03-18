const mongoose = require('mongoose');

import { TokenSearch } from './index';
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


test('busqueda por tokens', async () => {
    const schema = new mongoose.Schema({
        documento: String,
        nombre: String,
        apellido: String,
    });
    schema.plugin(TokenSearch(['documento', 'nombre', 'apellido']));
    const Model = mongoose.model('prueba', schema);

    const m1 = new Model({ documento: '1010', nombre: 'mariano', apellido: 'botta' });
    const m2 = new Model({ documento: '1010', nombre: 'maria', apellido: 'bottazi' });

    await m1.save();
    await m2.save();

    const respuesta = await Model.find(
        Model.search('botta mariano')
    );
    expect(respuesta.length).toBe(1);


    const respuesta2 = await Model.find(
        Model.search('botta')
    );
    expect(respuesta2.length).toBe(2);

    const respuesta3 = await Model.find(
        Model.search('botta maria')
    );
    expect(respuesta3.length).toBe(1);

    const respuesta4 = await Model.find(
        Model.search('maria botta')
    );
    expect(respuesta4.length).toBe(1);


    const respuesta5 = await Model.find(
        Model.search('botta de', { minLength: 3 })
    );
    expect(respuesta5.length).toBe(2);

});
