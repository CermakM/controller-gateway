import process from 'process'
import yaml from 'js-yaml'

const ENV_CONTROLLER_CONFIG = 'CONTROLLER_CONFIG'

export interface Config {
    controllers: Controller[];
}

export interface Controller {
    name  : string;
    config: any;
}

function isValid(config: Config): config is Config {
    return [
        config.controllers != undefined,
        config.controllers.length   > 0,
        // at least one controller is defined
        config.controllers[0].name   != undefined,
        config.controllers[0].config != undefined
    ].every(Boolean)
}

function parseConfig(): Config {
    const rawConfig: string = process.env[ENV_CONTROLLER_CONFIG] || ''
    if (rawConfig.length <= 0) {
        throw Error('Unable to parse the config.')
    }

    const config: Config = yaml.safeLoad(rawConfig)
    if(!isValid(config)) {
        throw Error('Invalid configuration provided.')
    }

    return config
}

// @ts-ignore
export const config: Config = parseConfig()
