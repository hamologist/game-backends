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
import { makeMove } from '../shared/services/game-state-mutator';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { GameStateResult } from '../shared/models/game-state';
import { TextEncoder } from 'util';
import { getObservable } from '../shared/models/observable';

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(SUCCESS_MESSAGE, await handler(restEventTransformer, event));
    } catch (err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.requestContext.connectionId === undefined) {
        console.error('Missing connection id');
    }

    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const result = await handler(webSocketEventTransformer, event);
        const observable = await getObservable(result.gameState.id);

        if (observable?.connectionIds) {
            const payload = new TextEncoder().encode(JSON.stringify(result.gameState));
            for (const connectionId of observable.connectionIds) {
                await client.send(new PostToConnectionCommand({
                    ConnectionId: connectionId,
                    Data: payload,
                }));
            }
        }

        return createSuccessResponse(SUCCESS_MESSAGE, result);
    } catch (err: any) {
        console.error('Error', err);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(err.toString()))
        }));

        return createErrorResponse(err);
    }
}

export const handler = async (
    eventTransformer: EventTransformer,
    event: APIGatewayProxyEvent,
): Promise<{ gameState: GameStateResult }> => {
    let body: {
        gameStateId: string,
        playerId: string,
        playerSecret: string,
        cord: { x: number, y: number },
    };
    body = eventTransformer<typeof body>({
        type: 'object',
        properties: {
            gameStateId: { type: 'string' },
            playerId: { type: 'string' },
            playerSecret: { type: 'string' },
            cord: {
                type: 'object',
                properties: {
                    x: {type: 'number'},
                    y: {type: 'number'},
                },
                required: ['x', 'y'],
            },
        },
        required: ['gameStateId', 'playerId', 'playerSecret', 'cord'],
        additionalProperties: false
    }, event);

    const gameState = await makeMove(
        body.gameStateId,
        body.playerId,
        body.playerSecret,
        body.cord,
    );
    return { gameState };
};
