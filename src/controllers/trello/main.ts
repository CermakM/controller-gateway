import crypto from 'crypto'

import express, { Request, Response, NextFunction } from 'express'
import HTTPStatus from 'http-status-codes'

import { Manager } from '../../manager'
import { Client, Reconciler } from './trello'

function base64Digest(s: string, secret: crypto.BinaryLike): string {
    return crypto.createHmac('sha1', secret).update(s).digest('base64')
}

function verify(req: Request, secret: crypto.BinaryLike, callbackURL: string): boolean {
    const content = JSON.stringify(req.body) + callbackURL
    const doubleHash = base64Digest(content, secret)
    const headerHash = req.headers['x-trello-webhook']

    return doubleHash == headerHash
}

const router = express.Router()
const trello: Client = new Client()

// TODO: provide an endpoint for this
const plugins = [
    '/plugins/label_reconciler.js',
    '/plugins/story_point_reconciler.js',
]
const trelloReconciler: Reconciler = new Reconciler(trello, plugins)

// Plugins
router.use('/plugins', express.static('plugins'))

// Middleware
router.use((req: Request, res: Response, next: NextFunction) => {
    console.debug(`[${req.method}] New request: `, req.baseUrl)

    // TODO: verify(req);
    next()
})

router.use(express.json())

// Webhook validation
router.head('/', (req: Request, res: Response) => {
    res.status(200).send()
})

router.get('/auth', (req: Request, res: Response) => {
    const p = trello.authorized()

    p
        .then( () => {
            res.status(HTTPStatus.OK).send('Authorized')
        })
        .catch( (err: any) => {  // TODO: Create type for the RequestErrorResponse
            console.error(err.response.toJSON())
            res.status(err.statusCode).send(err.response.statusMessage)
        })
})

router.get('/whoami', (req: Request, res: Response) => {
    const p = trello.authorized()

    p
        .then( (payload: any) => {
            res.status(HTTPStatus.OK).send(payload)
        })
        .catch( (err: any) => {  // TODO: Create type for the RequestErrorResponse
            console.error(err.response.toJSON())
            res.status(err.statusCode).send(err.response.statusMessage)
        })
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
    trelloReconciler.reconcile(req)

    res.status(HTTPStatus.CREATED).end()
})

export function register(manager: Manager) { manager.add('/trello', router) }
