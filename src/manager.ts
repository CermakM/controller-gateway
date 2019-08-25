import { Router } from 'express'
import _ from 'lodash'

interface Controller {
    register(manager: Manager): void;
}

export class Manager {

    constructor() {
        // discover this.controllers
        const controllers: Controller[] = require('require-all')({
            dirname: __dirname + '/controllers/',
            recursive: true,
        })

        for (const ctrl of Object.values(controllers)) {
            ctrl.register(this)
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
