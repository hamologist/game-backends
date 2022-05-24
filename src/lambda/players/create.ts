import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import {
    EventTransformer,
    restEventTransformer,
    webSocketEventTransformer
} from '../shared/services/event-processor';
import { createPlayer } from '../shared/models/player';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { TextEncoder } from 'util';

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(SUCCESS_MESSAGE, await handler(restEventTransformer, event));
    } catch(err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const result = await handler(webSocketEventTransformer, event);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(result)),
        }));

        return createSuccessResponse(SUCCESS_MESSAGE, result);
    } catch(err) {
        return createErrorResponse(err);
    }
};

const handler = async (
    eventTransformer: EventTransformer,
    event: APIGatewayProxyEvent,
): Promise<{ playerId: string, playerSecret: string }> => {
    let body: { username: string };
    body = eventTransformer<typeof body>({
        type: 'object',
        properties: {
            username: { type: 'string' }
        },
        required: ['username'],
        additionalProperties: false
    }, event);

    const result = await createPlayer(body.username)
    return {
        playerId: result.id,
        playerSecret: result.secret,
    };
};
