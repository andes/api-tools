import * as mongoose from 'mongoose';

export function createSchema(connection: mongoose.Connection) {

    const WebHookSchema = new mongoose.Schema({
        nombre: String,
        event: String,
        url: String,
        method: {
            type: String,
            default: 'POST',
            enum: ['POST', 'PUT', 'PATCH', 'GET']
        },
        headers: mongoose.SchemaTypes.Mixed, // for Token AUTH
        data: mongoose.SchemaTypes.Mixed, // a projections of data to send
        filters: [mongoose.SchemaTypes.Mixed], // posibles filtros filtros
        trasform: {
            type: String,
            required: false
        },
        active: Boolean,
        rules: mongoose.SchemaTypes.Mixed,
        etl: mongoose.SchemaTypes.Mixed,
        plain: Boolean

    }, { timestamps: true });

    connection.model('webhook', WebHookSchema, 'webhook');


    const WebHookLogSchema = new mongoose.Schema({
        event: String,
        url: String,
        method: {
            type: String,
            default: 'POST',
            enum: ['POST', 'PUT', 'PATCH', 'GET']
        },
        headers: mongoose.SchemaTypes.Mixed, // for Token AUTH
        body: mongoose.SchemaTypes.Mixed, // a projections of data to send
        subscriptionId: mongoose.SchemaTypes.ObjectId,
        status: Number,
        response: mongoose.SchemaTypes.Mixed,
        updatedAt: Date
    }, { timestamps: true });

    connection.model('webhookLog', WebHookLogSchema, 'webhookLog');

}

