import { randomBytes, randomUUID } from 'crypto';
import { documentClient } from '../clients/document-client';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const PLAYER_TABLE_NAME = process.env.PLAYER_TABLE_NAME;

export type PlayerResult = {
    id: string;
    secret: string;
    username: string;
    expirationTime: number;
};

export const createPlayer = async (
    username: string,
): Promise<PlayerResult> => {
    const playerId = randomUUID();
    const playerSecret = randomBytes(20).toString('hex');
    const expirationTime = (Math.floor(Date.now() / 1000)) + (60 * 60);

    await documentClient.send(
        new PutCommand({
            TableName: PLAYER_TABLE_NAME,
            Item: {
                id: playerId,
                secret: playerSecret,
                username: username,
                expirationTime,
            },
        })
    );

    return {
        id: playerId,
        secret: playerSecret,
        username,
        expirationTime,
    }
};

export const getPlayer = async (
    playerId: string,
): Promise<PlayerResult | null> => {
    const result = await documentClient.send(
        new GetCommand({
            TableName: PLAYER_TABLE_NAME,
            Key: {
                id: playerId,
            },
        })
    );

    if (result.Item === undefined) {
        return null;
    }

    return {
        id: result.Item.id,
        secret: result.Item.secret,
        username: result.Item.username,
        expirationTime: result.Item.expirationTime,
    };
};

export const updatePlayerExpirationTime = async (
    playerId: string,
): Promise<PlayerResult | null> => {
    const { Attributes: attributes } = await documentClient.send(
        new UpdateCommand({
            TableName: PLAYER_TABLE_NAME,
            Key: { id: playerId },
            UpdateExpression: 'set #e = :e',
            ExpressionAttributeNames: {
                '#e': 'expirationTime',
            },
            ExpressionAttributeValues: {
                ':e': (Math.floor(Date.now() / 1000)) + (60 * 60),
            },
            ReturnValues: 'ALL_NEW',
        })
    );

    if (attributes === undefined) {
        return null;
    }

    return attributes as PlayerResult;
};
