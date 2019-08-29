import crypto, { verify } from 'crypto'

import express, { Request, Response, NextFunction } from 'express'
import HTTPStatus from 'http-status-codes'

import { Manager } from '../../manager'
import { Reconciler } from './kebechet'

const router = express.Router()

const kebechetReconciler: Reconciler = new Reconciler()

// Plugins
router.use('/plugins', express.static('plugins'))

// Middleware
router.use((req: Request, res: Response, next: NextFunction) => {
    console.debug(`[${req.method}] New request: `, req.baseUrl)

    // TODO: verify(req)  // verify Git Hub headers
    next()
})

router.use(express.json())

// Webhook validation
router.head('/', (req: Request, res: Response) => {
    res.status(200).send()
})

// Routes
router.post('/', (req: Request, res: Response) => {
    const contentType: string | undefined = req.header('Content-Type')
    if (contentType != 'application/json') {
        res.status(HTTPStatus.BAD_REQUEST).send(
            `Incorrect or unexpected content type: ${contentType}`
        )
    }

    // Reconcile the request with available plugins
    kebechetReconciler.reconcile(req)

    // res.status(HTTPStatus.CREATED).end()
    res.status(HTTPStatus.CREATED).send(req.body)  // DEBUG: deletme
})

export function register(manager: Manager) { manager.add('/kebechet', router) }
