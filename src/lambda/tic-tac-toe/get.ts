import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eventPathTransformer } from '../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { getGame } from '../shared/models/game-state';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let body: { id: string };
    try {
        body = eventPathTransformer<typeof body>({
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
        const gameState = await getGame(body.id);
        if (gameState === null) {
            return createErrorResponse('Provided gameStateId does not exist.')
        }
        return createSuccessResponse(SUCCESS_MESSAGE, { gameState });
    } catch (err) {
        return createErrorResponse(err);
    }
};
