import { Connection } from 'mongoose';
import { HTTPClient } from './http-client';
import { StaticClient } from './static-client';
import { Logger } from '@andes/log';

// [TODO] Logger

export class AndesServices {


    constructor(
        private mainConnection: Connection,
        private loggerConnection: Connection
    ) {

    }

    private _dinamicServices = {};

    public register(name: string, fn: any) {
        if (this._dinamicServices[name]) {
            throw new Error(`Servicio [${name}] ya se encuentra registrado`);
        }
        this._dinamicServices[name] = fn;
    }

    public get(name: string) {
        const _self = this;
        return {
            async exec(params: any) {
                const servicio = await _self.mainConnection.collection('andes-services').findOne({ key: name });

                if (!servicio) {
                    throw new Error(`[${name}] service not found`);
                }

                const config = servicio.configuration;

                let value;

                const logInfo = {
                    info: servicio.logging === true || servicio.logging?.info === true,
                    error: servicio.logging === true || servicio.logging?.error === true
                };

                try {

                    switch (servicio.type) {
                        case 'http-client':


                            value = await HTTPClient(config, params);


                            break;

                        case 'static-client':

                            value = await StaticClient(config, params);


                            break;

                        case 'dinamic-client':
                            const serviceCallback = _self._dinamicServices[name];
                            if (!serviceCallback) {
                                throw new Error(`servicio dinamico [${name}] no encontrado`);

                            }

                            value = serviceCallback(config, params);

                    }

                    if (logInfo.info) {
                        const log = new Logger({
                            connection: _self.loggerConnection,
                            module: 'andes-services',
                            type: servicio.name,
                            application: 'andes'
                        });

                        log.info('exec', params);

                    }

                    return value;

                } catch (e) {
                    if (logInfo.error) {
                        const log = new Logger({
                            connection: _self.loggerConnection,
                            module: 'andes-services',
                            type: servicio.name,
                            application: 'andes'
                        });

                        log.error('exec', params, e);

                    }

                    throw e;
                }

            }
        };

    }


}
