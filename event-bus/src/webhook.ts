import * as mongoose from 'mongoose';
import { Engine } from 'json-rules-engine';
import { EventBus } from './event-bus';
import { createSchema } from './webhook.schema';
import { ETL } from '@andes/etl';

const request = require('request');


export async function WebhookSetup(
    eventCore: EventBus,
    connection: mongoose.Connection,
    etl: ETL = null
) {

    createSchema(connection);

    if (!etl) {
        etl = new ETL();
    }


    eventCore.on(/.*/, async function (this: any, body: any) {
        const event = this.event;
        const WebHook = connection.model('webhook');
        const WebHookLog = connection.model('webhookLog');

        const subscriptions = await WebHook.find({
            active: true,
            event
        });

        body = JSON.parse(JSON.stringify(body));

        subscriptions.forEach(async (sub: any) => {

            const valid = await verificarFiltros(sub, body);
            if (!valid) {
                return;
            }

            const eBody = sub.etl ? etl.transform(body, sub.etl) : body;

            const data = sub.plain ? eBody : {
                id: new mongoose.Types.ObjectId(),
                subscription: sub._id,
                data: eBody,
                event
            };

            request({
                method: sub.method,
                uri: sub.url,
                headers: sub.headers,
                body: data,
                json: true,
                timeout: 10000,
            }, (error: any, response: any, _body: any) => {

                const log = new WebHookLog({
                    event,
                    url: sub.url,
                    method: sub.method,
                    headers: sub.headers,
                    body: data,
                    subscriptionId: sub._id,
                    status: error ? 0 : response.statusCode,
                    response: _body
                });
                log.save();
            });

        });
    });


}


async function verificarFiltros(subscription: any, body: any) {
    if (subscription && subscription.rules) {

        const engine = new Engine();

        const _body = JSON.parse(JSON.stringify(body)); // Engine tiene problemas al leer modelos de Mongoose

        engine.addFact('data', _body);

        engine.addRule({
            conditions: subscription.rules,
            event: { type: 'valid' }
        });


        return engine
            .run()
            .then(({ events }) => {
                return events.length > 0;
            });

    } else {
        return true;
    }
}
