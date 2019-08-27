import { AuditPlugin } from './index';
import * as mongoose from 'mongoose';

test('should emit true', () => {

    const schema = new mongoose.Schema({});
    schema.plugin(AuditPlugin);
    const Model = mongoose.model('prueba', schema);
    const m = new Model({});
    expect(typeof (m as any).audit).toBe('function');

});

