import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteConnection, getConnection } from '../shared/models/connection';
import { removeConnectionsFromObservable } from '../shared/models/observable';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.requestContext.connectionId === undefined) {
        return {
            statusCode: 500,
            body: 'Missing connection ID',
        };
    }

    const connection = await getConnection(event.requestContext.connectionId);
    if (connection === null) {
        return {
            statusCode: 500,
            body: 'Failed to disconnect',
        }
    }

    const promises = [];
    if (connection.observableIds !== undefined) {
        for (const observableId of connection?.observableIds) {
            promises.push(removeConnectionsFromObservable(observableId, [connection.id]));
        }
        await Promise.all(promises);
    }

    if (!await deleteConnection(event.requestContext.connectionId)) {
        return {
            statusCode: 500,
            body: 'Failed to disconnect',
        };
    }

    return {
        statusCode: 200,
        body: 'Disconnected',
    };
}
