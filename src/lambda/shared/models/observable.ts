import { documentClient } from '../clients/document-client';
import { PutCommand, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const OBSERVABLE_TABLE_NAME = process.env.OBSERVABLE_TABLE_NAME;

export interface ObservableResult {
    observableId: string;
    connectionIds: string[];
}

export const createObservable = async(
    observableId: string,
    connectionId: string,
): Promise<boolean> => {
    try {
        await documentClient.send(
            new PutCommand({
                TableName: OBSERVABLE_TABLE_NAME,
                Item: {
                    observableId,
                    connectionIds: new Set([connectionId])
                },
            }),
        );
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
};

export const getObservable = async(
    observableId: string
): Promise<ObservableResult> => {
    try {
        const result = await documentClient.send(
            new GetCommand({
                TableName: OBSERVABLE_TABLE_NAME,
                Key: {
                    "observableId": observableId
                },
            }),
        );

        return result.Item as ObservableResult;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const addConnectionsToObservable = async (
    observableId: string,
    connectionIds: string[],
): Promise<boolean> => {
    try {
        await documentClient.send(
            new UpdateCommand({
                TableName: OBSERVABLE_TABLE_NAME,
                Key: {
                    'observableId': observableId,
                },
                ExpressionAttributeValues: {
                    ':connectionIds': new Set(connectionIds),
                },
                UpdateExpression: 'ADD connectionIds :connectionIds',
            }),
        );

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const removeConnectionsFromObservable = async (
    observableId: string,
    connectionIds: string[],
): Promise<boolean> => {
    try {
        await documentClient.send(
            new UpdateCommand({
                TableName: OBSERVABLE_TABLE_NAME,
                Key: {
                    'observableId': observableId,
                },
                ExpressionAttributeValues: {
                    ':connectionIds': new Set(connectionIds),
                },
                UpdateExpression: 'DELETE connectionIds :connectionIds',
            }),
        );

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const deleteObservable = async(
    observableId: string,
): Promise<boolean> => {
    try {
        await documentClient.send(
            new DeleteCommand({
                TableName: OBSERVABLE_TABLE_NAME,
                Key: {
                    observableId,
                },
            }),
        );
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
};
