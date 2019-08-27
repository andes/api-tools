import * as asyncHandler from 'express-async-handler';
import { Request as ERequest, Response as EResponse, Router, NextFunction } from 'express';


export function apiOptions(req: ERequest): IOptions {
    const options: IOptions = {};
    options.fields = req.query.fields;
    options.limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    options.skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    return options;
}

export {
    asyncHandler,
    Router,
    NextFunction
};

export interface IOptions {
    fields?: string;
    skip?: number;
    limit?: number;
}

export interface Request extends ERequest {
    apiOptions(): IOptions;
    resources: any;
}

export interface Response extends EResponse {

}