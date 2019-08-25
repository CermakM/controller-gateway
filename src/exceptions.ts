/**
 * @summary A error thrown when a method is defined but not implemented (yet).
 */
export class NotImplementedError extends Error {
    constructor(name: string) {
        super()

        const err: Error = new Error()

        if (err.stack != undefined) {
            this.message = `The method ${name} is not implemented.`
        }
    }
}