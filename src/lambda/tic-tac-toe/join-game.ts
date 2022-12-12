import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
            await handler(JSON.parse(event.body!))
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

    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const result = await handler(JSON.parse(event.body!).payload);
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
};

export const handler = async (payload: HandlerPayload): Promise<{ gameState: GameStateResult }> => {
    const gameState = await joinGame(payload.id, payload.player.id, payload.player.secret);
    return { gameState }
};
