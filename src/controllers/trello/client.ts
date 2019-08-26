/**
 * Trello client interface to authorize users and manage a Trello board
 */

const apiVersion   = '1'
const apiEndpoint  = 'https://api.trello.com'
const authEndpoint = 'https://auth.trello.com'

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

export default class TrelloClient {
    private _key  : string | undefined
    private _token: string | undefined

    constructor() {}

    public get key(): string | undefined {
        return this._key
    }
    public get token(): string | undefined {
        return this._token
    }

    public authorized(): boolean {
        return this._token != null
    }

    public authorize(key: string, opts: AuthorizationOptions) {
        opts

    }
}