import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyEvent } from "aws-lambda";

let client: ApiGatewayManagementApiClient | null = null;

export const retrieveClient = (
    requestContext: APIGatewayProxyEvent['requestContext']
): ApiGatewayManagementApiClient => {
    if (client === null) {
        client = new ApiGatewayManagementApiClient({
            endpoint: `https://${requestContext.domainName}/${requestContext.stage}`,
        });
    }

    return client;
};