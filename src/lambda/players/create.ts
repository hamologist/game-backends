import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { createPlayer } from '../shared/models/player';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { TextEncoder } from 'util';

interface HandlerPayload {
    username: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            await handler(JSON.parse(event.body!)),
        );
    } catch(err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const result = await handler(JSON.parse(event.body!).payload);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(result)),
        }));

        return createSuccessResponse(SUCCESS_MESSAGE, result);
    } catch(err) {
        return createErrorResponse(err);
    }
};

const handler = async (payload: HandlerPayload): Promise<{
    playerId: string;
    playerSecret: string;
}> => {
    const result = await createPlayer(payload.username)
    return {
        playerId: result.id,
        playerSecret: result.secret,
    };
};
