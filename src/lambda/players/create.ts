import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { createPlayer, PlayerResult } from '../shared/models/player';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { TextEncoder } from 'util';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    username: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            { player: await handler(JSON.parse(event.body!)) },
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
        const player = await handler(JSON.parse(event.body!).payload);
        const responsePayload = {
            message: 'Update',
            action: 'createPlayer',
            player,
        };
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(responsePayload)),
        }));

        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch(err) {
        return createErrorResponse(err);
    }
};

const handler = async (payload: HandlerPayload): Promise<PlayerResult> => {
    return await createPlayer(payload.username)
};
