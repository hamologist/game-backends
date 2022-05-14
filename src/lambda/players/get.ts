import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eventPathProcessor } from '../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { getPlayer } from '../shared/models/player';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let body: { id: string };
    try {
        body = eventPathProcessor<typeof body>({
            type: 'object',
            properties: {
                id: { type: 'string' }
            },
            required: ['id'],
            additionalProperties: false
        }, event);
    } catch (err) {
        return createErrorResponse(err);
    }

    try {
        const result = await getPlayer(body.id);
        if (result === null) {
            return createErrorResponse('Provided playerId does not exist.')
        }
        return createSuccessResponse(SUCCESS_MESSAGE, { username: result.username });
    } catch (err) {
        return createErrorResponse(err);
    }
};
