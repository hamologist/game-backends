import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { documentClient } from '../shared/models/document-client';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

const CONNECTION_TABLE_NAME = process.env.CONNECTION_TABLE_NAME;

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

    try {
        await documentClient.send(
            new DeleteCommand({
                TableName: CONNECTION_TABLE_NAME,
                Key: {
                    id: event.requestContext.connectionId,
                }
            }),
        );
    } catch (error) {
        return {
            statusCode: 500,
            body: `Failed to disconnect: ${JSON.stringify(error)}`,
        };
    }

    return {
        statusCode: 200,
        body: 'Disconnected',
    };
}
