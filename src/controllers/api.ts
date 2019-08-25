import { Request, Response } from 'express';
import Controller from './base';

/**
 * GET /api
 * List of API examples.
 */
export class APIController extends Controller {
    constructor() { super('api'); }

    public get(req: Request, res: Response) {
        res.render('api/index', {
            title: 'API Examples'
        });
    }
}

export default APIController;