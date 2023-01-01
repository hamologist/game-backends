import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { makeMove } from '../shared/services/game-state-mutator';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { GameStateResult } from '../shared/models/game-state';
import { TextEncoder } from 'util';
import { getObservable } from '../shared/models/observable';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    id: string;
    player: {
        id: string;
        secret: string;
    }
    cord: { x: number; y: number; };
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    // TODO: Websocket connections should be updated when using this codepath as well
    try {
        const result = await handler(JSON.parse(event.body!));
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            { gameState: result.gameState },
        );
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

    const client = retrieveClient(event.requestContext);

    try {
        const result = await handler(JSON.parse(event.body!).payload);
        const observable = await getObservable(result.gameState.id);

        if (observable?.connectionIds) {
            const payload = new TextEncoder().encode(JSON.stringify({
                message: 'Update',
                action: 'makeMoveTicTacToe',
                gameState: result.gameState
            }));
            for (const connectionId of observable.connectionIds) {
                try {
                    await client.send(new PostToConnectionCommand({
                        ConnectionId: connectionId,
                        Data: payload,
                    }));
                } catch (err) {
                    console.error(`Failed to alert ConnectionId: "${connectionId}" of makeMoveTicTacToe Update`);
                }
            }
        }

        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch (err: any) {
        console.error('Error', err);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify({
                message: 'Error: failed to process move',
                action: 'makeMoveTicTacToe',
            }))
        }));

        return createErrorResponse(err);
    }
};

export const handler = async (payload: HandlerPayload): Promise<{ gameState: GameStateResult }> => {
    const gameState = await makeMove(
        payload.id,
        payload.player.id,
        payload.player.secret,
        payload.cord,
    );
    return { gameState };
};
