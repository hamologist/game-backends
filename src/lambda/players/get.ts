import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { getPlayer } from '../shared/models/player';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';
import { StatusError } from '../shared/utilities/status-error';

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
            await handler(event.pathParameters),
        );
    } catch(err) {
        return createErrorResponse(err);
    }
}

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const player = await handler(JSON.parse(event.body!).payload);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(player)),
        }));

        console.log('Success');
        return createSuccessResponse(SUCCESS_MESSAGE, player);
    } catch(err) {
        if (err instanceof Error) {
            await client.send(new PostToConnectionCommand({
                ConnectionId: event.requestContext.connectionId,
                Data: new TextEncoder().encode(JSON.stringify({
                    error: 'PLAYER_NOT_FOUND',
                    message: err.message,
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
        throw new StatusError('Provided playerId does not exist.', 404);
    }
    return { username: result.username };
};
