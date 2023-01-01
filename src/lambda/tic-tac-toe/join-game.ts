import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { joinGame } from '../shared/services/game-state-mutator';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { GameStateResult } from '../shared/models/game-state';
import { TextEncoder } from 'util';
import { addObservablesToConnection } from '../shared/models/connection';
import { addConnectionsToObservable, getObservable } from '../shared/models/observable';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    id: string;
    player: {
        id: string;
        secret: string;
    };
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            { gameState: await handler(JSON.parse(event.body!)) },
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
        await addObservablesToConnection(event.requestContext.connectionId, [result.gameState.id]);
        await addConnectionsToObservable(result.gameState.id, [event.requestContext.connectionId]);

        const observable = await getObservable(result.gameState.id);

        if (observable?.connectionIds) {
            const payload = new TextEncoder().encode(JSON.stringify({
                message: 'Update',
                action: 'joinGameTicTacToe',
                gameState: result.gameState
            }));
            for (const connectionId of observable.connectionIds) {
                try {
                    await client.send(new PostToConnectionCommand({
                        ConnectionId: connectionId,
                        Data: payload,
                    }));
                } catch (err) {
                    console.error(`Failed to alert ConnectionId: "${connectionId}" of joinGameTicTacToe Update`);
                }
            }
        }

        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch(err) {
        if (err instanceof Error) {
            await client.send(new PostToConnectionCommand({
                ConnectionId: event.requestContext.connectionId,
                Data: new TextEncoder().encode(JSON.stringify({
                    message: 'Error: Failed to join game',
                    action: 'joinGameTicTacToe',
                })),
            }));
        }

        console.log('Error', err);
        return createErrorResponse(err);
    }
};

export const handler = async (payload: HandlerPayload): Promise<{ gameState: GameStateResult }> => {
    const gameState = await joinGame(payload.id, payload.player.id, payload.player.secret);
    return { gameState }
};
