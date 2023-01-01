import { PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { retrieveClient } from "../shared/clients/api-gateway-management-api-client";
import { addObservablesToConnection } from "../shared/models/connection";
import { getGame } from "../shared/models/game-state";
import { addConnectionsToObservable } from "../shared/models/observable";
import { createErrorResponse, createSuccessResponse, SUCCESS_MESSAGE } from "../shared/utilities/response-helpers";

export const webSocketHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.requestContext.connectionId === undefined) {
        return createErrorResponse(new Error('Missing connection id'));
    }

    const payload: {
        gameState: {
            id: string;
        }
    } = JSON.parse(event.body!).payload;
    const client = retrieveClient(event.requestContext);

    try {
        const gameState = await getGame(payload.gameState.id);

        if (gameState === null) {
            await client.send(new PostToConnectionCommand({
                ConnectionId: event.requestContext.connectionId,
                Data: new TextEncoder().encode(JSON.stringify({
                    message: "Game state id doesn't exist",
                    action: 'observeGameTicTacToe',
                })),
            }));

            return createSuccessResponse(SUCCESS_MESSAGE);
        }

        await addObservablesToConnection(event.requestContext.connectionId, [payload.gameState.id]);
        await addConnectionsToObservable(payload.gameState.id, [event.requestContext.connectionId]);

        await client.send(new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: new TextEncoder().encode(JSON.stringify({
                message: 'Update',
                action: 'observeGameTicTacToe',
            })),
        }));

        return createSuccessResponse(SUCCESS_MESSAGE);
    } catch (err) {
        if (err instanceof Error) {
            await client.send(new PostToConnectionCommand({
                ConnectionId: event.requestContext.connectionId,
                Data: new TextEncoder().encode(JSON.stringify({
                    message: 'Error: Failed to observe game',
                    action: 'observeGameTicTacToe',
                })),
            }));
        }

        console.log('Error', err);
        return createErrorResponse(err);
    }
};
