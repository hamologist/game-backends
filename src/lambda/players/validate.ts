import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    EventTransformer,
    restEventTransformer,
    webSocketEventTransformer
} from '../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse
} from '../shared/utilities/response-helpers';
import { playerValidator } from '../shared/services/player-validator';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(await handler(restEventTransformer, event));
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
        const result = await handler(webSocketEventTransformer, event);
        console.log('result', result);
        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(result),
        }));

        console.log('Success');
        return createSuccessResponse(result);
    } catch(err) {
        console.log('Error', err);
        return createErrorResponse(err);
    }
};

const handler = async (
    eventTransformer: EventTransformer,
    event: APIGatewayProxyEvent,
): Promise<string> => {
    let body: { playerId: string, playerSecret: string };
    body = eventTransformer<typeof body>({
        type: 'object',
        properties: {
            playerId: { type: 'string' },
            playerSecret: { type: 'string'},
        },
        required: ['playerId', 'playerSecret'],
        additionalProperties: false
    }, event);

    if (!await playerValidator(body.playerId, body.playerSecret)) {
        return 'Invalid'
    }
    return 'Valid';
}
