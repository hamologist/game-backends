import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    eventPathTransformer,
    EventTransformer,
    webSocketEventTransformer
} from '../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { GameStateResult, getGame } from '../shared/models/game-state';
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
    } catch (err) {
        return createErrorResponse(err);
    }
}

export const webSocketHandler = async(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const gameState = await handler(webSocketEventTransformer, event);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(gameState)),
        }));

        console.log('Success');
        return createSuccessResponse(SUCCESS_MESSAGE, gameState);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
}

export const handler = async (
    eventTransformer: EventTransformer,
    event: APIGatewayProxyEvent,
): Promise<{ gameState: GameStateResult }> => {
    let body: { id: string };
    body = eventTransformer<typeof body>({
        type: 'object',
        properties: {
            id: { type: 'string' }
        },
        required: ['id'],
        additionalProperties: false
    }, event);

    const gameState = await getGame(body.id);
    if (gameState === null) {
        console.error(`Failed to find gameStateId: "${body.id}"`)
        throw new Error('Provided gameStateId does not exist.')
    }
    return { gameState };
};

