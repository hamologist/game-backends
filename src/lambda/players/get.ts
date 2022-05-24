import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    EventTransformer,
    eventPathTransformer,
    webSocketEventTransformer
} from '../shared/services/event-processor';
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

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(SUCCESS_MESSAGE, await handler(eventPathTransformer, event));
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
        const player = await handler(webSocketEventTransformer, event);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(player)),
        }));

        console.log('Success');
        return createSuccessResponse(SUCCESS_MESSAGE, player);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
};

export const handler = async (
    eventTransformer: EventTransformer,
    event: APIGatewayProxyEvent,
): Promise<{ username: string }> => {
    let body: { id: string };
    body = eventTransformer<typeof body>({
        type: 'object',
        properties: {
            id: { type: 'string' }
        },
        required: ['id'],
        additionalProperties: false
    }, event);

    const result = await getPlayer(body.id);
    if (result === null) {
        console.error(`Failed to find playerId: "${body.id}"`)
        throw new Error('Provided playerId does not exist.');
    }
    return { username: result.username };
};
