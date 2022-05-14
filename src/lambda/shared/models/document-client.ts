import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const documentClientEndpoint = process.env.DOCUMENT_CLIENT_ENDPOINT;
let options = {};

if (!!documentClientEndpoint) {
    options = {
        endpoint: documentClientEndpoint
    };
}

export const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
