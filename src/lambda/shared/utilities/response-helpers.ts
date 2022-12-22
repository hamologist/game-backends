import { APIGatewayProxyResult } from 'aws-lambda';
import { StatusError } from './status-error';

export const SUCCESS_MESSAGE = 'Success';

const createResponse = (
    statusCode: number,
    message: string,
    obj: { [keys: string]: any } = {},
): APIGatewayProxyResult => {
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
): ReturnType<typeof createResponse> => {
    if (!(err instanceof StatusError)) {
        return createResponse(500, err.toString(), obj);
    }

    return createResponse(err.statusCode, err.message, obj);
}

export const createSuccessResponse = (
    message: string = SUCCESS_MESSAGE,
    obj: { [keys: string]: any } = {},
): ReturnType<typeof createResponse> => {
    return createResponse(200, message, obj);
}
