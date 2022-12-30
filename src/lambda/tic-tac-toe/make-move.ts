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
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            await handler(JSON.parse(event.body!))
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
