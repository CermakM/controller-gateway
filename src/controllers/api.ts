import { Request, Response } from 'express'
import express from 'express'

import { Manager } from '../manager'


const router = express.Router()

/**
 * GET /api
 * List of API examples.
 */
router.get('/', (req: Request, res: Response) => {
    res.render('api/index', {
        title: 'API Examples'
    })
})

export function register(manager: Manager) { manager.add('/api', router) }
