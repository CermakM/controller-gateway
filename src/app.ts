import express, { Request, Response } from 'express';
import process from 'process';
import _ from 'lodash';

// Controllers (route handlers)
import APIController from './controllers/api';
import TrelloController from './controllers/trello';

const app  = express();

const apiController    = new APIController();
const trelloController = new TrelloController();


// Express configuration
app.set('PORT', _.get(process.env, 'PORT', 5000));

// Routes
app.get('/', (req: Request, res: Response) => {
    return res.send(null);  // TODO: return the schema
});

app.get('/trello', TrelloController.call);
app.put('/trello', TrelloController.call);

/**
 * API view routes
 */
app.get('/api', apiController.call);

export default app;