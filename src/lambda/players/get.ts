import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { getPlayer } from '../shared/models/player';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';
import { StatusError } from '../shared/utilities/status-error';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    id: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent & {
        pathParameters: HandlerPayload;
    }
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            { player: await handler(event.pathParameters) },
        );
    } catch(err) {
        return createErrorResponse(err);
    }
}

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = retrieveClient(event.requestContext);

    try {
        const player = await handler(JSON.parse(event.body!).payload);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify({
                message: 'Update',
                action: 'getPlayer',
                player,
            })),
        }));

        console.log(SUCCESS_MESSAGE);
        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch(err) {
        if (err instanceof Error) {
            await client.send(new PostToConnectionCommand({
                ConnectionId: event.requestContext.connectionId,
                Data: new TextEncoder().encode(JSON.stringify({
                    message: 'Error: Player not found',
                    action: 'getPlayer',
                })),
            }));
        }

        console.log('Error', err);
        return createErrorResponse(err);
    }
};

export const handler = async (payload: HandlerPayload,): Promise<{ username: string }> => {
    const result = await getPlayer(payload.id);
    if (result === null) {
        console.error(`Failed to find playerId: "${payload.id}"`)
        throw new StatusError('Player not found', 404);
    }
    return { username: result.username };
};
