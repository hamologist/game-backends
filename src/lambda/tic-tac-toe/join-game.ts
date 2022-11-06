import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    EventTransformer,
    restEventTransformer,
    webSocketEventTransformer
} from '../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { joinGame } from '../shared/services/game-state-mutator';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { GameStateResult } from '../shared/models/game-state';
import { TextEncoder } from 'util';
import { addObservablesToConnection } from '../shared/models/connection';
import { addConnectionsToObservable } from '../shared/models/observable';

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(SUCCESS_MESSAGE, await handler(restEventTransformer, event));
    } catch(err) {
        return createErrorResponse(err);
    }
}

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.requestContext.connectionId === undefined) {
        return createErrorResponse(new Error('Missing connection id'));
    }

    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const result = await handler(webSocketEventTransformer, event);
        await addObservablesToConnection(event.requestContext.connectionId, [result.gameState.id]);
        await addConnectionsToObservable(result.gameState.id, [event.requestContext.connectionId]);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(result)),
        }));

        return createSuccessResponse(SUCCESS_MESSAGE, result);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
}

export const handler = async (
    eventTransformer: EventTransformer,
    event: APIGatewayProxyEvent
): Promise<{ gameState: GameStateResult }> => {
    let body: {
        gameStateId: string,
        playerId: string,
        playerSecret: string,
    };
    body = eventTransformer<typeof body>({
        type: 'object',
        properties: {
            gameStateId: { type: 'string' },
            playerId: { type: 'string' },
            playerSecret: { type: 'string' },
        },
        required: ['gameStateId', 'playerId', 'playerSecret'],
        additionalProperties: false
    }, event);

    const gameState = await joinGame(body.gameStateId, body.playerId, body.playerSecret);
    return { gameState }
}
