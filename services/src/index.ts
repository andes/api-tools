import { AndesCache } from '@andes/core';
import { ETL } from '@andes/etl';
import { Logger } from '@andes/log';
import { Connection } from 'mongoose';
import { EmailClient } from './email-client';
import { HTTPClient } from './http-client';
import { MongoClient } from './mongo-client';
import { StaticClient } from './static-client';


export class AndesServices {

    private etl = new ETL();

    constructor(
        private mainConnection: Connection,
        private loggerConnection: Connection,
        private connections: { [key: string]: Connection } = null,
        private cacheStore: AndesCache
    ) {
        this.connections = connections || {};
        this.connections['main'] = mainConnection;
    }

    private _dinamicServices = {};

    transform(data: any, schema: any) {
        return this.etl.transform(data, schema);
    }

    addFunction(name: string, fn: any) {
        this.etl.addFunction(name, fn);
    }

    public register(name: string, fn: any) {
        if (this._dinamicServices[name]) {
            throw new Error(`Servicio [${name}] ya se encuentra registrado`);
        }
        this._dinamicServices[name] = fn;
    }

    public get(name: string) {
        const _self = this;
        let servicio: any;
        return {
            async info() {
                if (!servicio) {
                    servicio = await _self.mainConnection.collection('andes-services').findOne({ name });
                }

                return servicio;
            },
            async exec(params: any = {}) {
                if (!servicio) {
                    servicio = await _self.mainConnection.collection('andes-services').findOne({ name });
                }

                if (!servicio) {
                    throw new Error(`[${name}] service not found`);
                }

                const config = servicio.configuration;
                const cache = servicio.cache;

                let value;

                const logInfo = {
                    info: servicio.logging === true || servicio.logging?.info === true,
                    error: servicio.logging === true || servicio.logging?.error === true
                };

                let cacheTtl;
                let realKey;
                if (cache && _self.cacheStore) {
                    cacheTtl = cache.ttl || 60 * 60;
                    const key = cache.key ? _self.etl.transform(params, cache.key) : 'default';
                    realKey = `andes-services-${name}-${key}`;


                    value = await _self.cacheStore.get(realKey);

                }

                try {

                    if (!value) {
                        switch (servicio.type) {
                            case 'http-client':


                                value = await HTTPClient(_self.etl, config, params);


                                break;

                            case 'email-client':

                                value = await EmailClient(_self.etl, config, params);


                                break;

                            case 'static-client':

                                value = await StaticClient(_self.etl, config, params);


                                break;

                            case 'dinamic-client':
                                const serviceCallback = _self._dinamicServices[config.name];
                                if (!serviceCallback) {
                                    throw new Error(`servicio dinamico [${config.name}] no encontrado`);
                                }

                                value = await serviceCallback(config, params);

                                break;
                            case 'mongo-client':

                                value = await MongoClient(_self.etl, _self.connections, config, params);

                                break;

                        }

                        if (cache && _self.cacheStore) {
                            _self.cacheStore.set(realKey, value, cacheTtl);
                        }
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
