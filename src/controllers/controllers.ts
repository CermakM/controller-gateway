import { Manager } from '../manager'

import * as apiController from './api/api'
import * as trelloController from './trello/main'
import * as kebechetController from './kebechet/main'

export interface Controller {
    register(manager: Manager): void;
}

const controllers: Controller[] = [
    apiController,
    trelloController,
    kebechetController
]

export default controllers
