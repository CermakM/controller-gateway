/**
 * Kebechet controller to reconcile registered Git Hub webhooks
 */

import { Request } from 'express'

// import * as v1 from '../../api/github'

export class Reconciler {
    constructor() { }

    public reconcile(req: Request) {
        // TODO
        console.log(req.body)
    }
}
