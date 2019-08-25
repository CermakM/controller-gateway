import crypto from 'crypto'
import express, { Request, Response, NextFunction } from 'express'

import { Manager } from '../manager'

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

router.use((req: Request, res: Response, next: NextFunction) => {
    console.debug(`[${req.method}] New request: `, req.url)

    // verify(req);
    next()
})

router.use(express.json())


router.post('/', (req: Request, res: Response) => {
    console.log('request', req)

    const contentType: string | undefined = req.header('Content-Type')
    if (contentType != 'application/json') {
        res.status(403).send(
            `Incorrect or unexpected content type: ${contentType}`
        )
    }

    // res.status(201).send('Webhook is being processed')
    res.status(200).json(req.body)
})

export function register(manager: Manager) { manager.add('/trello', router) }
