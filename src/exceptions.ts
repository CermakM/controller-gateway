/**
 * @summary A error thrown when a method is defined but not implemented (yet).
 */
export class NotImplementedError extends Error {
    constructor() {
        super();

        const err: Error = new Error;
        if (err.stack != undefined) {
            const caller: string = err.stack.split('\n')[2].replace(' at ', '');

            this.message = `The method ${caller} isn't implemented.`;
        }
    }
}