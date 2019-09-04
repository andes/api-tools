import { Model as _Model, Types } from 'mongoose';
import { Request, Response, asyncHandler, IOptions, Router, NextFunction } from '@andes/api-tool';
import { MongoQuery } from '../query-builder';


export type ObjectId = string | Types.ObjectId;

/**
 * [TODO] Manejo de errores
 * [TODO] Simple searchFilter from schema type by default
 */

export abstract class ResourceBase {
    public abstract Model: _Model<any>;

    public resourceModule = '';
    public resourceName = '';
    public searchFileds: object = {};

    public routesEnable = ['get', 'find', 'post', 'patch', 'delete'];

    public middlewares: any[] = [];
    public routesAuthorization = {};

    public eventBus: any = null;

    constructor(args: any) {
        const { eventBus } = args;
        this.eventBus = eventBus;
    }
    /**
     * Popula datos antes de guardar.
     * Se podría usar el middleware de mongoose
     */

    public populate(dto: any) {
        return dto;
    }

    private isRouteEnabled(routeName: string) {
        return this.routesEnable.includes(routeName);
    }

    public checkAuthorization(routeName: string, req: Request) {
        const checker = this.routesAuthorization[routeName];
        if (!checker) {
            return true;
        }
        if (typeof checker !== 'function') {
            throw new Error(`routesAuthorization[${routeName}] must be a function`);
        }

        return checker(req);
    }

    public async create(dto: any, req: Request) {
        dto = this.populate(dto);
        const document = new this.Model(dto);

        if (document.audit) {
            document.audit(req);
        }

        await document.save();

        if (this.eventBus) {
            this.eventBus.emitAsync(`${this.resourceModule}:${this.resourceName}:create`, document);
        }

        return document;
    }

    public async update(id: ObjectId, data: any, req: Request) {
        let document = await this.Model.findById(id);
        if (document) {
            data = this.populate(data);
            document.set(data);

            if (document.audit) {
                document.audit(req);
            }
            await document.save();

            if (this.eventBus) {
                this.eventBus.emitAsync(`${this.resourceModule}:${this.resourceName}:update`, document);
            }

            return document;
        }
        return null;
    }

    public async remove(id: ObjectId) {
        const document = await this.Model.findById(id);
        if (document) {
            const state = await document.remove();

            if (this.eventBus) {
                this.eventBus.emitAsync(`${this.resourceModule}:${this.resourceName}:remove`, document);
            }

            return state;
        }
        return null;
    }

    public async prefind(data: Object, req: Request) {
        return {};
    }

    public async find(data: any, options: IOptions, req: Request) {
        const preconditions = await this.prefind(data, req);
        const conditions = MongoQuery.buildQuery(data, this.searchFileds);
        const { fields, skip, limit } = options;
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

        return await this.Model.find(query);
    }

    public async findById(id: ObjectId, options: IOptions) {
        const { fields } = options;
        const query = this.Model.findById(id);
        if (fields) {
            query.select(fields);
        }
        return await query;
    }


    public makeRoutes(): Router {
        const router = Router();

        if (this.isRouteEnabled('find')) {
            router.get(`/${this.resourceName}`, ...this.middlewares, asyncHandler(routesFunctions['find'].bind(this)));
        }

        if (this.isRouteEnabled('get')) {
            router.get(`/${this.resourceName}/:id`, ...this.middlewares, asyncHandler(routesFunctions['get'].bind(this)));
        }

        if (this.isRouteEnabled('post')) {
            router.post(`/${this.resourceName}`, ...this.middlewares, asyncHandler(routesFunctions['post'].bind(this)));
        }

        if (this.isRouteEnabled('patch')) {
            router.patch(`/${this.resourceName}/:id`, ...this.middlewares, asyncHandler(routesFunctions['patch'].bind(this)));
        }

        if (this.isRouteEnabled('delete')) {
            router.delete(`/${this.resourceName}/:id`, ...this.middlewares, asyncHandler(routesFunctions['delete'].bind(this)));
        }

        return router;
    }

}

const routesFunctions = {
    async find(this: any, req: Request, res: Response) {
        if (!this.checkAuthorization('find', req)) {
            throw new Error('unauthorize');
        }
        const options = req.apiOptions();
        const data = req.query;
        const plantillas = await this.find(data, options, req);
        return res.json(plantillas);
    },

    async get(this: any, req: Request, res: Response, next: NextFunction) {
        if (!this.checkAuthorization('get', req)) {
            throw new Error('unauthorize');
        }
        const options = req.apiOptions();
        const id = req.params.id;
        const document = await this.findById(id, options);
        if (document) {
            return res.json(document);
        } else {
            return next('NOT FOUND');
        }
    },

    async post(this: any, req: Request, res: Response, next: NextFunction) {
        if (!this.checkAuthorization('post', req)) {
            throw new Error('unauthorize');
        }
        const body = req.body;
        const document = await this.create(body, req);
        if (document) {
            return res.json(document);
        } else {
            return next(422);
        }
    },

    async patch(this: any, req: Request, res: Response, next: NextFunction) {
        if (!this.checkAuthorization('patch', req)) {
            throw new Error('unauthorize');
        }
        const id = req.params.id;
        const body = req.body;
        const document = await this.update(id, body, req);
        if (document) {
            return res.json(document);
        } else {
            return next(422);
        }
    },

    async delete(this: any, req: Request, res: Response, next: NextFunction) {
        if (!this.checkAuthorization('delete', req)) {
            throw new Error('unauthorize');
        }
        const id = req.params.id;
        const document = await this.remove(id);
        if (document) {
            return res.json(document);
        } else {
            return next(422);
        }
    }

};
