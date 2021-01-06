import { asyncHandler, Request, Response, Router, NextFunction } from '@andes/api-tool';
import { Model as _Model, Document, Types } from 'mongoose';
import { ResourceBase, ResourceNotFound } from '.';
import { MemoryQuery } from '../query-builder';


export abstract class SubresourceBase<T extends Document = any> {
    public model: _Model<T>;
    subresourceId = 'id';
    resourceName: string;  // Nombre del recurso primario
    subresourceName: string; //Nombre del subrecurso
    key: string;
    filter: {};
    public subRoutesEnable = ['get', 'find', 'post', 'patch', 'delete'];
    public eventBus: any = null;

    constructor(modelo: T) {
        this.model = modelo;
    }

    getResource(req: Request) {
        return req.resources[this.resourceName];
    }

    private getSubresource(resource: Document) {
        return resource[this.key];
    }

    resourceLabel() {
        return `id${this.resourceName}`;
    }

    /**
     * Crea un objeto
     */
    public make(body: any) {
        const subresource = new (this.model as any)();
        subresource.set(body);
        return subresource;
    }

    /**
     * Agrega un elemento
     */

    public store(resource: Document, element: any) {
        let subresource = this.getSubresource(resource);
        let index = subresource.findIndex((item: any) => item.id === element.id);
        if (index >= 0) {
            subresource.splice(index, 1, element);
        } else {
            subresource.push(element);
        }
        return element;
    }

    /**
    * Modifica un elemento
    */

    public set(element: Document, body: any) {
        element.set(body);
        return element;
    }

    /**
    * Busca un elemento
    * @returns
    */

    public findById(resource: Document, id: string | Types.ObjectId) {
        const subresource = this.getSubresource(resource);
        let element = subresource.id(id);
        return element;
    }

    /**
    * Busca los elementos que coincidan con la query
    * @returns
    */

    find(resource: Document, query: any) {
        let subresource = this.getSubresource(resource);
        if (query) {
            const items = subresource.filter((item: any) => {
                return MemoryQuery.buildQuery(query, this.filter, item);
            });
            return items;
        } else {
            return subresource;
        }
    }

    /**
     * Elimina un subrecurso
     */

    public delete(resource: Document, id: string | Types.ObjectId) {
        let subresource = this.getSubresource(resource);
        subresource = subresource.filter((item: any) => (item.id !== id));
        resource[this.key] = subresource;
        return subresource;
    }



    /**
     * Busca un recurso primario.
     */

    async findResource(recurso: ResourceBase<any>, req: Request, res: Response, next: NextFunction) {
        const resourceId = this.resourceLabel();
        const resource = await recurso.findById(req.params[resourceId], {});
        if (resource) {
            req.resources = req.resources || {};
            req.resources[this.resourceName] = resource;
            return next();
        } else {
            throw new ResourceNotFound();
        }
    }

    /**
     * Graba el recurso primario
     */

    /* async save(recurso: ResourceBase,resource: Document, req) {
        await recurso.store(resource, req);
    } */

    /**
     * Genera las rutas de los subrecursos.
     */


    public makeSubRoutes(): Router {

        const resourceId = this.resourceLabel();
        const router = Router();
        router.param(resourceId, asyncHandler(this.findResource.bind(this)));


        return router;
    }

    subRoutesFunctions = {

        async find(this: SubresourceBase<any>, req: Request, res: Response) {
            const resource = this.getResource(req);
            let lista = this.find(resource, req.query);
            return res.json(lista);
        },

        async get(this: SubresourceBase<any>, req: Request, res: Response) {
            const resource = this.getResource(req);
            const lista = this.findById(resource, req.params[this.subresourceId]);
            return res.json(lista);
        },

        async post(this: SubresourceBase<any>, req: Request, res: Response) {
            const resource = this.getResource(req);
            let newElement = this.make(req.body);
            this.store(resource, newElement);
            await this.save(resource, req);
            return res.json(newElement);
        },

        async patch(this: SubresourceBase<any>, req: Request, res: Response) {
            const resource = this.getResource(req);
            let subresource = this.findById(resource, req.params[this.subresourceId]);
            if (subresource) {
                let subresource_update = subresource.set(req.body);
                this.store(resource, subresource_update);
                await this.save(resource, req);
            }
            return res.json(subresource);
        },

        async delete(this: SubresourceBase<any>, req: Request, res: Response) {
            const resource = this.getResource(req);
            let subresource = this.delete(resource, req.params[this.subresourceId]);
            await this.save(resource, req);
            return res.json(subresource);
        }

    }
}