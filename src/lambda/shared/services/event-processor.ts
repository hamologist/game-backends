import AJV, { JSONSchemaType } from 'ajv';
import { APIGatewayProxyEvent } from 'aws-lambda';

const ajv = new AJV();

const defaultPreProcessor = (payload: any): any => {
    return payload;
}

const eventProcessor = <T>(
    schema: JSONSchemaType<T>,
    payload: any,
    preProcessor: (payload: any) => any = defaultPreProcessor
): T => {
    if (payload === null) {
        throw EventProcessorError.requiredFieldsAreMissing(schema);
    }
    payload = preProcessor(payload)

    const validate = ajv.compile(schema);

    if (!validate(payload)) {
        console.log('Invalid payload');
        console.log(validate.errors);
        throw new EventProcessorError(validate.errors!.join(', '));
    }

    return payload;
}

export class EventProcessorError extends Error {
    constructor(message: string) {
        super(message);
    }

    public static requiredFieldsAreMissing<T>(
        { required }: JSONSchemaType<T>
    ): EventProcessorError {
        let fields = '';

        if (required.length === 1) {
            fields = required[0];
        } else {
            fields = `${required.slice(0, -1).join(', ')} and ${required[required.length - 1]}`;
        }

        return new EventProcessorError(
            `Request is missing the following required fields: ${fields}`
        );
    }
}

export type EventTransformer = <T>(
    schema: JSONSchemaType<T>,
    event: APIGatewayProxyEvent,
) => T;

/**
 * @throws {EventProcessorError}
 */
export const restEventTransformer: EventTransformer = function <T>(
    schema: JSONSchemaType<T>,
    { body }: APIGatewayProxyEvent,
): T {
    const preProcessor = (payload: any) => {
        try {
            return JSON.parse(payload);
        } catch (err) {
            throw new EventProcessorError(`JSON parse error: ${err}`);
        }
    }

    return eventProcessor(schema, body, preProcessor)
}

/**
 * @throws {EventProcessorError}
 */
export const webSocketEventTransformer: EventTransformer = function <T>(
    schema: JSONSchemaType<T>,
    { body }: APIGatewayProxyEvent,
): T {
    const preProcessor = (payload: any) => {
        let messagePayload;

        try {
            messagePayload = JSON.parse(payload).payload;
        } catch (err) {
            throw new EventProcessorError(`JSON parse error: ${err}`);
        }
        if (messagePayload === undefined) {
            throw new EventProcessorError(`WebSocket message is missing required field, "payload"`);
        }

        return messagePayload
    }

    return eventProcessor(schema, body, preProcessor)
}

export const eventPathTransformer: EventTransformer = function <T>(
    schema: JSONSchemaType<T>,
    { pathParameters }: APIGatewayProxyEvent,
): T {
    return eventProcessor(schema, pathParameters);
}
