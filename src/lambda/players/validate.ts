import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { playerValidator } from '../shared/services/player-validator';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    id: string;
    secret: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            { valid: await handler(JSON.parse(event.body!)) },
        );
    } catch(err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = retrieveClient(event.requestContext);

    try {
        const valid = await handler(JSON.parse(event.body!).payload);
        const responsePayload = JSON.stringify({
            message: 'Update',
            action: 'validatePlayer',
            valid,
        });
        console.log('result', valid);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(responsePayload),
        }));

        console.log(SUCCESS_MESSAGE);
        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
};

const handler = async (
    payload: HandlerPayload,
): Promise<boolean> => {
    return await playerValidator(payload.id, payload.secret);
}
