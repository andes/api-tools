import { Model as _Model, Types, Document } from 'mongoose';
import { Request, Response, asyncHandler, IOptions, Router, NextFunction } from '@andes/api-tool';
import { MongoQuery } from '../query-builder';


export type ObjectId = string | Types.ObjectId;

export class ResourceNotFound extends Error {
    status = 404;
    message = 'recurso no encontrado';
}

export class ResourceForbidden extends Error {
    status = 403;
    message = 'forbidden';
}

export class CustomError extends Error {
    status = 500;
    constructor(message: string, status = 500) {
        super();
        this.message = message;
        this.status = status;
    }
}

export interface RouteConfiguration {
    method?: string;
    path: string;
    callback: Function | string;
}

/**
 * [TODO] Simple searchFilter from schema type by default
 */

export abstract class ResourceBase<T extends Document = any> {
    public abstract Model: _Model<T>;

    public keyId = '_id';

    public resourceModule = '';
    public resourceName = '';
    public searchFileds: object = {};

    public routesEnable = ['get', 'search', 'post', 'patch', 'delete'];

    public middlewares: any[] = [];
    public routesAuthorization = {};

    public extrasRoutes: RouteConfiguration[] = [];

    public eventBus: any = null;

    constructor(args?: any) {
        args = args || {};
        const { eventBus } = args;
        this.eventBus = eventBus;
    }
    /**
     * Popula datos antes de guardar.
     * Se podría usar el middleware de mongoose
     */

    public async populate(dto: any) {
        return dto;
    }

    private isRouteEnabled(routeName: string) {
        return this.routesEnable.includes(routeName);
    }

    public makeMiddleware(routeName: string) {
        let localMiddleware = this.routesAuthorization[routeName];
        if (localMiddleware) {
            localMiddleware = Array.isArray(localMiddleware) ? localMiddleware : [localMiddleware];
        } else {
            localMiddleware = [];
        }
        return [...this.middlewares, ...localMiddleware];
    }

    public checkAuthorization(routeName: string, req: Request) {
        const checker = this.routesAuthorization[routeName];
        if (!checker) {
            return true;
        }
        if (typeof checker !== 'function') {
            throw new CustomError(`routesAuthorization[${routeName}] must be a function`);
        }

        return checker(req);
    }

    public async create(dto: any, req: Request): Promise<T> {
        dto = await this.populate(dto);
        const document = new this.Model(dto);
        if ((document as any).audit) {
            (document as any).audit(req);
        }

        await document.save();

        if (this.eventBus) {
            this.eventBus.emitAsync(`${this.resourceModule}:${this.resourceName}:create`, document);
        }

        return document;
    }

    public async update(id: ObjectId, data: any, req: Request): Promise<T> {
        const document = await this.findById(id, {});
        if (document) {
            data = await this.populate(data);
            document.set(data);

            if ((document as any).audit) {
                (document as any).audit(req);
            }
            const fieldsChange = document.modifiedPaths();
            await document.save();

            if (this.eventBus) {
                this.eventBus.emitAsync(`${this.resourceModule}:${this.resourceName}:update`, document, fieldsChange);
            }

            return document;
        }
        return null;
    }

    public async remove(id: ObjectId) {
        const document = await this.Model.findById(id, {});
        if (document) {
            const state = await document.remove();

            if (this.eventBus) {
                this.eventBus.emitAsync(`${this.resourceModule}:${this.resourceName}:remove`, document);
            }

            return state;
        }
        return null;
    }

    public async presearch(data: Object, req: Request) {
        return {};
    }

    public async search(data: any, options: IOptions, req: Request) {
        const preconditions = await this.presearch(data, req);
        const conditions = MongoQuery.buildQuery(data, this.searchFileds);
        const { fields, skip, limit, sort } = options;
        let query = this.Model.find({
            ...preconditions,
            ...conditions
        });

        if (fields) {
            query.select(fields);
        }
        if (limit) {
            query.limit(limit);
        }
        if (skip) {
            query.skip(skip);
        }
        if (sort) {
            query.sort(sort);
        }

        return await this.Model.find(query);
    }

    public async findById(id: ObjectId | any, options: IOptions) {
        const { fields } = options;
        const conditions = {};
        conditions[this.keyId] = id;
        const query = this.Model.findOne(conditions);
        if (fields) {
            query.select(fields);
        }
        return await query;
    }


    public makeRoutes(): Router {
        const router = Router();

        if (this.isRouteEnabled('search')) {
            const middlewares = this.makeMiddleware('search');
            router.get(`/${this.resourceName}`, ...middlewares, asyncHandler(routesFunctions['search'].bind(this)));
        }

        if (this.isRouteEnabled('get')) {
            const middlewares = this.makeMiddleware('get');
            router.get(`/${this.resourceName}/:id`, ...middlewares, asyncHandler(routesFunctions['get'].bind(this)));
        }

        if (this.isRouteEnabled('post')) {
            const middlewares = this.makeMiddleware('post');
            router.post(`/${this.resourceName}`, ...middlewares, asyncHandler(routesFunctions['post'].bind(this)));
        }

        if (this.isRouteEnabled('patch')) {
            const middlewares = this.makeMiddleware('patch');
            router.patch(`/${this.resourceName}/:id`, ...middlewares, asyncHandler(routesFunctions['patch'].bind(this)));
        }

        if (this.isRouteEnabled('delete')) {
            const middlewares = this.makeMiddleware('delete');
            router.delete(`/${this.resourceName}/:id`, ...middlewares, asyncHandler(routesFunctions['delete'].bind(this)));
        }

        this.extrasRoutes.forEach((route) => {
            const path = `/${this.resourceName}/${route.path}`;
            const fnMethod: Function = router[route.method || 'get'];

            let middlewares = this.middlewares;
            let callback;
            if (typeof route.callback === 'string') {
                middlewares = this.makeMiddleware(route.callback);
                callback = this[route.callback];
            } else {
                callback = route.callback;
            }
            fnMethod.call(router, path, ...middlewares, asyncHandler(callback.bind(this)));
        });

        return router;
    }

}

const routesFunctions = {
    async search(this: ResourceBase<any>, req: Request, res: Response) {
        const options = req.apiOptions();
        const data = req.query;
        const plantillas = await this.search(data, options, req);
        return res.json(plantillas);
    },

    async get(this: ResourceBase<any>, req: Request, res: Response, next: NextFunction) {
        const options = req.apiOptions();
        const id = req.params.id;
        const document = await this.findById(id, options);
        if (document) {
            return res.json(document);
        } else {
            return next('NOT FOUND');
        }
    },

    async post(this: ResourceBase<any>, req: Request, res: Response, next: NextFunction) {
        const body = req.body;
        const document = await this.create(body, req);
        if (document) {
            return res.json(document);
        } else {
            return next(422);
        }
    },

    async patch(this: ResourceBase<any>, req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const body = req.body;
        const document = await this.update(id, body, req);
        if (document) {
            return res.json(document);
        } else {
            throw new ResourceNotFound();
        }
    },

    async delete(this: ResourceBase<any>, req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        const document = await this.remove(id);
        if (document) {
            return res.json(document);
        } else {
            throw new ResourceNotFound();
        }
    }

};
