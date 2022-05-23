import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { restEventBodyProcessor } from '../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse, SUCCESS_MESSAGE
} from '../shared/utilities/response-helpers';
import { createGame } from '../shared/services/game-state-mutator';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let body: { playerId: string, playerSecret: string };
    try {
        body = restEventBodyProcessor<typeof body>({
            type: 'object',
            properties: {
                playerId: { type: 'string' },
                playerSecret: { type: 'string' },
            },
            required: ['playerId', 'playerSecret'],
            additionalProperties: false
        }, event);
    } catch (err) {
        return createErrorResponse(err);
    }

    try {
        const { id: gameStateId } = await createGame(body.playerId, body.playerSecret);
        return createSuccessResponse(SUCCESS_MESSAGE, { gameStateId })
    } catch (err) {
        return createErrorResponse(err);
    }
}
