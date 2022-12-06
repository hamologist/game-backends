import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { getPlayer } from '../shared/models/player';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';

interface HandlerPayload {
    id: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent & {
        pathParameters: HandlerPayload
    }
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(
            SUCCESS_MESSAGE,
            await handler(event.pathParameters),
        );
    } catch(err) {
        return createErrorResponse(err);
    }
}

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        const player = await handler(JSON.parse(event.body!).payload);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify(player)),
        }));

        console.log('Success');
        return createSuccessResponse(SUCCESS_MESSAGE, player);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
};

export const handler = async (payload: HandlerPayload,): Promise<{ username: string }> => {
    const result = await getPlayer(payload.id);
    if (result === null) {
        console.error(`Failed to find playerId: "${payload.id}"`)
        throw new Error('Provided playerId does not exist.');
    }
    return { username: result.username };
};
