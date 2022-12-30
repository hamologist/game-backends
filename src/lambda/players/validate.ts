import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createErrorResponse,
    createSuccessResponse
} from '../shared/utilities/response-helpers';
import { playerValidator } from '../shared/services/player-validator';
import {
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { TextEncoder } from 'util';
import { retrieveClient } from '../shared/clients/api-gateway-management-api-client';

interface HandlerPayload {
    id: string;
    secret: string;
}

export const apiHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        return createSuccessResponse(await handler(JSON.parse(event.body!)));
    } catch(err) {
        return createErrorResponse(err);
    }
};

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = retrieveClient(event.requestContext);

    try {
        const result = await handler(JSON.parse(event.body!).payload);
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
    payload: HandlerPayload,
): Promise<string> => {
    if (!await playerValidator(payload.id, payload.secret)) {
        return 'Invalid'
    }
    return 'Valid';
}
