import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eventBodyProcessor } from '../shared/services/event-processor';
import { createPlayer } from '../shared/models/player';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let body: { username: string };
    try {
        body = eventBodyProcessor<typeof body>({
            type: 'object',
            properties: {
                username: { type: 'string' }
            },
            required: ['username'],
            additionalProperties: false
        }, event);
    } catch (err) {
        return createErrorResponse(err);
    }

    try {
        const { id: playerId, secret: playerSecret } = await createPlayer(body.username)
        return createSuccessResponse(SUCCESS_MESSAGE, { playerId, playerSecret });
    } catch(err) {
        return createErrorResponse(err);
    }
};
