export class StatusError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode?: number) {
        super(message);

        this.statusCode = statusCode ?? 500;
    }
}
