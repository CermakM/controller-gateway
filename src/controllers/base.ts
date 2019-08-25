import { Request, Response } from 'express';
import _ from 'lodash';

import * as exc from '../exceptions';


class Controller {
    constructor(public readonly name: string) {}

    public call(req: Request, res: Response) {
        const method: ( ( req: Request, res: Response) => void ) = _.get(this, req.method);

        return method(req, res);
    }

    public get(
        req: Request,
        res: Response
    ): void { throw new exc.NotImplementedError(); }

    public put(
        req: Request,
        res: Response
    ): void { throw new exc.NotImplementedError(); }

    public post(
        req: Request,
        res: Response
    ): void { throw new exc.NotImplementedError(); }

    public delete(
        req: Request,
        res: Response
    ): void { throw new exc.NotImplementedError(); }
}

export default Controller;