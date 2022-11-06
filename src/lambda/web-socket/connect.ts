import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createConnection } from '../shared/models/connection';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.requestContext.connectionId === undefined) {
        return {
            statusCode: 500,
            body: 'Missing connection ID',
        };
    }

    if (!await createConnection(event.requestContext.connectionId)) {
        return {
            statusCode: 500,
            body: 'Failed to connect',
        };
    }

    return {
        statusCode: 200,
        body: 'Connected',
    };
}
