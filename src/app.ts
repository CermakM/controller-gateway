import express, { Request, Response } from 'express'
import process from 'process'
import _ from 'lodash'

import { Manager } from './manager'

const app = express()
const mgr = new Manager() 

// Express configuration
app.set('PORT', _.get(process.env, 'PORT', 5000))

// Routes
app.get('/', (req: Request, res: Response) => {
    return res.status(200).send(null)
})

// Controllers (route handlers)
for ( const path of mgr.list() ) {
    app.use(path, mgr.get(path))
}

export default app
