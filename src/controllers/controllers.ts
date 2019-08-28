import { Manager } from '../manager'

import * as apiController from './api/api'
import * as trelloController from './trello/main'

export interface Controller {
    register(manager: Manager): void;
}

const controllers: Controller[] = [
    apiController,
    trelloController
]

export default controllers
