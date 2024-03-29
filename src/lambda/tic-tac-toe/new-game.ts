import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse, SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { createGame } from '../shared/services/game-state-mutator';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';
import { addObservablesToConnection } from '../shared/models/connection';
import { createObservable } from '../shared/models/observable';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    player: {
        id: string;
        secret: string;
    };
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    // TODO: PlayerOne's websocket connection should be alerted (if existing) when using this codepath.

    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            {
                gameState: {
                    id: await handler(JSON.parse(event.body!)),
                },
            },
        );
    } catch(err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.requestContext.connectionId === undefined) {
        return createErrorResponse(new Error('Missing connection id'));
    }

    const client = retrieveClient(event.requestContext);

    try {
        const result = await handler(JSON.parse(event.body!).payload);
        await createObservable(result.gameStateId, event.requestContext.connectionId);
        await addObservablesToConnection(event.requestContext.connectionId, [result.gameStateId])
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify({
                message: 'Update',
                action: 'newGameTicTacToe',
                gameState: { id: result.gameStateId }
            })),
        }));

        return createSuccessResponse(SUCCESS_MESSAGE, result);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
};

const handler = async (payload: HandlerPayload): Promise<{ gameStateId: string }> => {
    const { id: gameStateId } = await createGame(payload.player.id, payload.player.secret);
    return { gameStateId }
};
