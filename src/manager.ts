import { Router } from 'express'
import _ from 'lodash'

import controllers from './controllers/controllers'

export class Manager {

    constructor() {
        // register the controllers
        for (const ctrl of Object.values(controllers)) {
            if (_.has(ctrl, 'register')) {
                // the controller should be registered to the manager
                ctrl.register(this)
            } else {
                throw Error('The controller does not implement `register` method')
            }
        }
    }

    private controllers: { [path: string]: Router } = {}

    public add(path: string, ctrl: Router) {
        if (_.has(this.controllers, path)) {
            throw Error(`Controller for ${path} is already registered.`)
        }

        this.controllers[path] = ctrl
        console.log(`Controller for ${path} has been successfully added.`)
    }

    public get(name: string): Router {
        return this.controllers[name]
    }

    public list(): string[] { return Object.keys(this.controllers) }
}
