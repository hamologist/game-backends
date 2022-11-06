import { documentClient } from './document-client';
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const CONNECTION_TABLE_NAME = process.env.CONNECTION_TABLE_NAME;

export interface ConnectionResult {
    id: string;
    observableIds: string[];
}

export const createConnection = async (
    connectionId: string,
): Promise<boolean> => {
    try {
        await documentClient.send(
            new PutCommand({
                TableName: CONNECTION_TABLE_NAME,
                Item: {
                    'id': connectionId,
                },
            }),
        );
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
};

export const getConnection = async (
    connectionId: string,
): Promise<ConnectionResult | null> => {
    try {
        const result = await documentClient.send(
            new GetCommand({
                TableName: CONNECTION_TABLE_NAME,
                Key: {
                    'id': connectionId,
                },
            }),
        );

        if (result.Item === undefined) {
            return null;
        }

        return result.Item as ConnectionResult;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const addObservablesToConnection = async (
    connectionId: string,
    observableIds: string[],
): Promise<boolean> => {
    try {
        await documentClient.send(
            new UpdateCommand({
                TableName: CONNECTION_TABLE_NAME,
                Key: {
                    'id': connectionId,
                },
                ExpressionAttributeValues: {
                    ':observableIds': new Set(observableIds),
                },
                UpdateExpression: 'ADD observableIds :observableIds',
            }),
        );

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const removeObservablesFromConnection = async (
    connectionId: string,
    observableIds: string[],
): Promise<boolean> => {
    try {
        await documentClient.send(
            new UpdateCommand({
                TableName: CONNECTION_TABLE_NAME,
                Key: {
                    'id': connectionId,
                },
                ExpressionAttributeValues: {
                    'observableIds': new Set(observableIds),
                },
                UpdateExpression: 'DELETE observableIds :observableIds',
            }),
        );

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const deleteConnection = async (
    connectionId: string,
): Promise<boolean> => {
    try {
        await documentClient.send(
            new DeleteCommand({
                TableName: CONNECTION_TABLE_NAME,
                Key: {
                    id: connectionId,
                }
            }),
        );
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
};
