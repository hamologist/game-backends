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
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            await handler(event.pathParameters)
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
        const gameState = await handler(JSON.parse(event.body!).payload);
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
};

export const handler = async (payload: HandlerPayload): Promise<{ gameState: GameStateResult }> => {
    const gameState = await getGame(payload.id);
    if (gameState === null) {
        console.error(`Failed to find gameStateId: "${payload.id}"`)
        throw new Error('Provided gameStateId does not exist.')
    }
    return { gameState };
};
