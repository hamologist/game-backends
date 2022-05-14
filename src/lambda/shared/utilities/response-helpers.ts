export const SUCCESS_MESSAGE = 'Success';

const createResponse = (
    statusCode: number,
    message: string,
    obj: { [keys: string]: any } = {},
) => {
    return {
        statusCode,
        body: createResponseBody(message, obj)
    };
}

const createResponseBody = (
    message: string,
    obj: { [keys: string]: any } = {},
): string => {
    const response: { [keys: string]: any } = {
        message,
    }

    for (const key of Object.keys(obj)) {
        response[key] = obj[key];
    }

    return JSON.stringify(response);
}

export const createErrorResponse = (
    err: any,
    obj: { [keys: string]: any } = {},
) => createResponse(500, err.toString(), obj);

export const createSuccessResponse = (
    message: string = SUCCESS_MESSAGE,
    obj: { [keys: string]: any } = {},
) => createResponse(200, message, obj);
