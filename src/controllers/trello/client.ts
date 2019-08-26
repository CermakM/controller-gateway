/**
 * Trello client interface to authorize users and manage a Trello board
 */

import process from 'process'
import request = require('request-promise-native')

import _ from 'lodash'

const apiVersion   = '1'
const apiEndpoint  = 'https://api.trello.com'
const authEndpoint = 'https://auth.trello.com'

export const ENV_TRELLO_APIKEY = 'TRELLO_APIKEY'
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

export class Client {
    private _key  : string | undefined
    private _token: string | undefined

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
    }

    public get key(): string | undefined {
        return this._key
    }
    public get token(): string | undefined {
        return this._token
    }

    public authorized(): Promise<any> {
        return this.rest('get', '/members/me')
            .then( r => {
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
        method  : 'get' | 'post' | 'put' | 'delete',
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

        console.debug('Sending request', options)

        return request(options)
    }
}