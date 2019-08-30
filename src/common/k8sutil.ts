import fs from 'fs'

export function getCurrentNamespace(): string | undefined {
    const path = '/var/run/secrets/kubernetes.io/serviceaccount/namespace'
    try {
        const name: string = fs.readFileSync(path, {
            encoding: 'utf8',
            flag: 'r'
        })
        return name
    } catch (err) { console.debug(err) }

    return undefined
}