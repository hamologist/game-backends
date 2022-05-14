import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eventBodyProcessor } from '../../shared/services/event-processor';
import {
    createErrorResponse,
    createSuccessResponse,
    SUCCESS_MESSAGE
} from '../../shared/utilities/response-helpers';
import { joinGame } from '../../shared/services/game-state-mutator';

export const lambdaHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let body: {
        gameStateId: string,
        playerId: string,
        playerSecret: string,
    };
    try {
        body = eventBodyProcessor<typeof body>({
            type: 'object',
            properties: {
                gameStateId: { type: 'string' },
                playerId: { type: 'string' },
                playerSecret: { type: 'string' },
            },
            required: ['gameStateId', 'playerId', 'playerSecret'],
            additionalProperties: false
        }, event);
    } catch (err) {
        return createErrorResponse(err);
    }

    try {
        const gameState = await joinGame(body.gameStateId, body.playerId, body.playerSecret);
        return createSuccessResponse(SUCCESS_MESSAGE, { gameState })
    } catch (err) {
        return createErrorResponse(err);
    }
}
