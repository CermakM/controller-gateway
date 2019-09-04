/**
 * Trello client interface to authorize users and manage a Trello board
 */

import { Request } from 'express'
import fetch, { Response} from 'node-fetch'
import process from 'process'

import request = require('request-promise-native')
import vm      = require('vm')

import _ from 'lodash'
import * as v1 from '../../api/trello'

const apiVersion   = '1'
const apiEndpoint  = 'https://api.trello.com'
const authEndpoint = 'https://auth.trello.com'

export const ENV_TRELLO_APIKEY = 'TRELLO_API_KEY'
export const ENV_TRELLO_TOKEN  = 'TRELLO_TOKEN'

export interface AuthorizationScope {
    account: boolean;
    read   : boolean;
    write  : boolean;
}

export interface AuthorizationOptions {
    expiration : string;
    interactive: boolean;
    persist    : boolean;
    scope      : AuthorizationScope;
    type       : string;
}

class Collection {
    private readonly _cl: Client
    constructor(client: Client, public readonly name: string) {
        this._cl = client
    }

    /**
     * Issue a 'GET' call to the API and retrieve information about the collection
    
     * .rest(method, path, params, success, error)
     * .rest(method, path, success, error)
    
     * @param id      - The collection ID
     * @param params  - Optional.  A hash of values to include in the querystring
     *   (e.g. { filter: "open", fields: "name,desc" })
     * @param body    - The request body
     * @param headers - The request headers
     *
     * @memberof TrelloClient
     */
    public get(id: string, ...args: any[]): request.RequestPromise {
        return this._cl.get(`${this.name}/${id}`, ...args)
    }
}

export class Client {
    private _key  : string | undefined
    private _token: string | undefined

    public readonly actions: Collection
    public readonly cards: Collection
    public readonly checklist: Collection
    public readonly boards: Collection
    public readonly lists: Collection
    public readonly members: Collection
    public readonly organizations: Collection

    constructor(key?: string, token?: string) {
        // Try to get the values from env
        if (key == undefined) {
            key = _.get(process.env, ENV_TRELLO_APIKEY, undefined)
        }
        if (token == undefined) {
            token = _.get(process.env, ENV_TRELLO_TOKEN, undefined)
        }
        this._key = key
        this._token = token

        this.actions       = new Collection(this, 'actions')
        this.boards        = new Collection(this, 'boards')
        this.cards         = new Collection(this, 'cards')
        this.checklist     = new Collection(this, 'Collection')
        this.lists         = new Collection(this, 'lists')
        this.members       = new Collection(this, 'members')
        this.organizations = new Collection(this, 'organizations')
    }

    public get key(): string | undefined {
        return this._key
    }
    public get token(): string | undefined {
        return this._token
    }

    public authorized(): Promise<any> {
        return this.rest('GET', '/members/me')
            .then( (r: v1.Member) => {
                return _.pick(
                    r, 'id', 'username', 'fullname', 'email', 'memberType'
                )
            })
    }

    /**
     * Issue a REST call to the API
    
     * .rest(method, path, params, success, error)
     * .rest(method, path, success, error)
    
     * @param method  - The HTTP method to use/simulate (e.g. GET, POST, PUT, DELETE)
     * @param path    - The API path to use (e.g. "members/me")
     * @param params  - Optional.  A hash of values to include in the querystring
     *   (e.g. { filter: "open", fields: "name,desc" })
     * @param body    - The request body
     * @param headers - The request headers
     *
     * @memberof TrelloClient
     */
    public rest(
        method  : 'GET' | 'POST' | 'PUT' | 'DELETE',
        path    : string,
        params? : any,
        body?   : any,
        headers?: any,
    ): request.RequestPromise {
        headers = Object.assign({'Content-Type': 'application/json'}, headers)
        const options = {
            method: method.toUpperCase(),
            url: `${apiEndpoint}/${apiVersion}/${path}`,
            headers: headers,
            qs: {
                ...this._key ? { key: this._key } : {},
                ...this._token ? { token: this._token } : {},
                ...params? params : {}
            },
            ...body   ? body   : {},
            ...params ? params : {},
            json: true
        }

        return request(options)
    }

    // Syntactic sugar for 'GET' request
    public get(path: string, ...args: any[]): request.RequestPromise {
        return this.rest('GET', path, ...args)
    }

    // Syntactic sugar for 'POST' request
    public post(path: string, ...args: any[]): request.RequestPromise {
        return this.rest('POST', path, ...args)
    }

    // Syntactic sugar for 'PUT' request
    public put(path: string, ...args: any[]): request.RequestPromise {
        return this.rest('PUT', path, ...args)
    }

    // Syntactic sugar for 'DELETE' request
    public delete(path: string, ...args: any[]): request.RequestPromise {
        return this.rest('DELETE', path, ...args)
    }
}

export interface ControllerConfig {
    plugins: Plugin[];
}

export interface Plugin {
    name  : string | undefined;
    url   : string;
    config: { rules: ModelConfig[] };
}

export interface ModelConfig {
    model  : Model;
    labels : Label[];
    columns: string[];
}

export interface Model {
    name: string;
}

export interface Label {
    id     : string;
    name   : string | undefined;
    selector: string;
}


export class Reconciler {
    private readonly _cl    : Client
    public  readonly plugins: Plugin[]

    constructor(client: Client, public readonly config: ControllerConfig) {
        this._cl = client 
        this.plugins = config.plugins
    }

    public async reconcile(req: Request) {
        // TODO: use logging library for easier logging (i.e, with field)
        // Create new context for the plugin executor
        const { action, model } : v1.Webhook = req.body
        const user = action.memberCreator

        console.log(
            `[${model.name}] action '${action.type}' by user '@${user.username}' detected`)
        console.log(
            `[${model.name}] Reconciling.`)

        if (this.plugins.length <= 0) {
            console.log(`[${model.name}] No executors found. Nothing to do.`)
            return
        }
        // TODO: get plugins registered for the action type
        // TODO: fetch and cache the plugins in constructor instead of doing it here
        for (const plugin of this.plugins) {
            const options: vm.RunningScriptOptions = {
                timeout: 1000,
                displayErrors: true
            }
            const context = vm.createContext({
                env   : process.env,
                model : model,
                action: action,
                config: plugin.config,
                Trello: this._cl,      // user gets the initialized client for convenience
            })
            context.console = {
                // plugin should be able to share logs
                log  : (...args: any[]) => console.log(`\t[${plugin.name}]`, ...args),
                error: (...args: any[]) => console.error(`\t[${plugin.name}]`, ...args),
            }

            const url = `${req.protocol}://${req.hostname}:${req.app.get('PORT')}${req.baseUrl}${plugin.url}`

            console.debug(`[${model.name}] Fetching plugin from url: `, url)
            await fetch(url)
                .then(res => res.text())
                .then(async executor => {
                    console.log(`[${model.name}] Running executor: `, plugin.name)

                    return await vm.runInNewContext(executor, context, options)
                })
                .then(() => console.log(`\t[${plugin.name}] Finished.`))
                .catch((err) => console.error(`[${model.name}] Error:`, err.response ? err.response.toJSON() : err))
        }

        console.log(`[${model.name}] Successfully reconciled.`)
    }
}
