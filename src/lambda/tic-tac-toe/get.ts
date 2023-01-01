import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { GameStateResult, getGame } from '../shared/models/game-state';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    id: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent & {
        pathParameters: HandlerPayload;
    }
): Promise<APIGatewayProxyResult> => {
    try {
        const result = await handler(event.pathParameters);
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            { gameState: result.gameState },
        );
    } catch (err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = retrieveClient(event.requestContext);

    try {
        const result = await handler(JSON.parse(event.body!).payload);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify({
                message: 'Update',
                action: 'getTicTacToe',
                gameState: result.gameState
            })),
        }));

        console.log(SUCCESS_MESSAGE);
        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch(err) {
        if (err instanceof Error) {
            await client.send(new PostToConnectionCommand({
                ConnectionId: event.requestContext.connectionId,
                Data: new TextEncoder().encode(JSON.stringify({
                    message: 'Error: Game state not found',
                    action: 'getTicTacToe',
                })),
            }));
        }

        console.log('Error', err);
        return createErrorResponse(err);
    }
};

export const handler = async (payload: HandlerPayload): Promise<{ gameState: GameStateResult }> => {
    const gameState = await getGame(payload.id);
    if (gameState === null) {
        console.error(`Failed to find gameStateId: "${payload.id}"`)
        throw new Error('Provided gameStateId does not exist.')
    }
    return { gameState };
};
