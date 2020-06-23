// import * as _asyncHandler from 'express-async-handler';
const _asyncHandler = require('express-async-handler');
import { Request as ERequest, Response as EResponse, Router, NextFunction } from 'express';


export function apiOptions(req: ERequest): IOptions {
    const options: IOptions = {};
    options.fields = req.query.fields as string;
    options.limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
    options.skip = req.query.skip ? parseInt(req.query.skip as string, 10) : null;
    options.sort = req.query.sort as string;
    return options;
}

export function apiOptionsMiddleware(req: any, res: any, next: any) {
    req.apiOptions = apiOptions.bind(null, req);
    next();
}

const asyncHandler = (handler: any) => {
    return (_asyncHandler as any)(handler);
};

export {
    asyncHandler,
    Router,
    NextFunction
};

export interface IOptions {
    fields?: string;
    skip?: number;
    limit?: number;
    sort?: string;
}

export interface Request extends ERequest {
    apiOptions(): IOptions;
    resources: any;
    user: any;
}

export interface Response extends EResponse {

}
