// @ts-ignore
import * as boolParser from 'express-query-boolean';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Express } from 'express';
import { initialize, optionalAuth } from './auth';
import { ErrorHandler } from './error-middleware';
import * as jwt from 'jsonwebtoken';
import { Passport } from 'passport';

interface PackageJson {
    name: string;
    version: string;
}

interface MSRouter extends express.Router {
    group(path: String, callback: (router: MSRouter) => void): void;
    group(callback: (router: MSRouter) => void): void;
}

export interface ApiBootstrapConfig {
    host?: string;
    port?: number;
    key?: string;
    expiresIn?: number;
    cors?: boolean;
}

function MSRouter(this: any): MSRouter {
    const r = express.Router.apply(this, arguments as any);
    (r as any).group = function (arg1: any, arg2: any) {
        let fn, path;
        if (arg2 === undefined) {
            path = '/';
            fn = arg1;
        } else {
            path = arg1;
            fn = arg2;
        }

        let router = MSRouter();
        fn(router);
        this.use(path, router);
        return router;
    };
    return (r as any);
}

export function Router(): express.Router {
    return express.Router();
}

type RouterExtendConfig = { path: string, router: express.Router };
export type RouterConfig = express.Router | RouterExtendConfig;

export class ApiBootstrap {
    private expressApp: Express;
    private _routes: RouterConfig[] = [];
    private _info: PackageJson;
    private port = 3000;
    private jwtKey: string;
    private expiresIn: number;
    private passport: any = new Passport();
    private cors = true;
    private server: any;
    private host: string;

    constructor(info: PackageJson, { port, host, key, expiresIn, cors }: ApiBootstrapConfig = {}) {
        this._info = info;
        this.port = port || 3000;
        this.jwtKey = key;
        this.expiresIn = expiresIn || 60 * 60 * 24; // 1 day
        this.cors = cors || true;
        this.host = host;
    }

    add(router: RouterConfig) {
        this._routes.push(router);
    }

    stop() {
        this.server.close();
    }

    start() {
        this.expressApp = express();
        if (this.jwtKey) {
            this.passport = initialize(this.passport, this.expressApp, this.jwtKey);
        }

        // Configura Express
        this.expressApp.use(bodyParser.json({ limit: '150mb' }));
        this.expressApp.use(boolParser());
        this.expressApp.use(bodyParser.urlencoded({
            extended: true
        }));

        // CORS
        if (this.cors) {
            this.expressApp.all('*', (req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

                // Permitir que el método OPTIONS funcione sin autenticación
                if ('OPTIONS' === req.method) {
                    res.header('Access-Control-Max-Age', '1728000');
                    res.sendStatus(200);
                } else {
                    next();
                }
            });
        }

        if (this.jwtKey) {
            this.expressApp.get('/session', this.authenticate(), (req: any, res: any) => {
                const user: any = req.user;
                delete user.iat;
                delete user.exp;
                return res.json(user);
            });
        }


        this.expressApp.get('/alive', (req, res) => {
            res.json({ status: 'OK' });
        });

        this.expressApp.get('/version', (req, res) => {
            res.json({
                name: this._info.name,
                version: this._info.version
            });
        });

        for (const routerConfig of this._routes) {
            if ((routerConfig as RouterExtendConfig).path) {
                const r = routerConfig as RouterExtendConfig;
                this.expressApp.use(r.path, r.router);
            } else {
                this.expressApp.use(routerConfig as express.Router);
            }
        }
        // Error handler
        this.expressApp.use(
            ErrorHandler(this.expressApp.get('env'))
        );
        this.server = this.expressApp.listen(this.port, this.host, () => {

        });
        return this.expressApp;
    }

    router() {
        return MSRouter();
    }

    authenticate() {
        return [
            this.passport.authenticate('jwt', { session: false })
        ];
    }

    optional() {
        if (this.jwtKey) {
            return [
                optionalAuth(this.jwtKey)
            ];
        } else {
            throw new Error('JWT Key not set');
        }
    }

    async sign(payload: any, expiresIn: number = null): Promise<string> {
        if (this.jwtKey) {
            return new Promise((resolve, reject) => {
                return jwt.sign(payload, this.jwtKey as string, { expiresIn: expiresIn || this.expiresIn }, (err, token) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(token);
                });
            });
        } else {
            throw new Error('JWT Key not set');
        }
    }

}
