import process from 'process'
import yaml from 'js-yaml'
import fs from 'fs';

const ENV_CONTROLLER_CONFIG = 'CONTROLLER_CONFIG'
const ENV_CONTROLLER_CONFIG_LOCAL = 'CONTROLLER_CONFIG_LOCAL'  // primarily for debug purposes
const ENV_CONTROLLER_CONFIG_PATH  = 'CONTROLLER_CONFIG_PATH'

const DEFAULT_CONTROLLER_CONFIG_PATH  = '.env'

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
    let rawConfig: string

    if (process.env[ENV_CONTROLLER_CONFIG_LOCAL] == 'true') {
        const configPath: string = process.env[ENV_CONTROLLER_CONFIG_PATH] || DEFAULT_CONTROLLER_CONFIG_PATH
        rawConfig = fs.readFileSync(configPath, 'utf8')
    } else {
        rawConfig = process.env[ENV_CONTROLLER_CONFIG] || ''
    }
    if (rawConfig.length <= 0) {
        throw Error('Empty config file.')
    }

    const config: Config = yaml.safeLoad(rawConfig)
    if(!isValid(config)) {
        throw Error('Invalid configuration provided.')
    }

    return config
}

// @ts-ignore
export const config: Config = parseConfig()
