import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../../players';
import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { TicTacToeContext } from '../context';

export interface TicTacToeMakeMoveProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
    ticTacToeContext: TicTacToeContext;
}

export class TicTacToeMakeMove extends Construct {
    public readonly makeMoveHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeMakeMoveProps) {
        super(scope, id);

        this.makeMoveHandler = props.ticTacToeContext.gameStateNodejsHandlerGenerator.generate('TicTacToeMakeMoveHandler', {
            entry: 'src/lambda/tic-tac-toe/make-move.ts',
            handler: 'apiHandler',
            functionName: 'TicTacToeMakeMoveRestHandler',
        });
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.makeMoveHandler);
        props.playersContext.playerTable.grantReadWriteData(this.makeMoveHandler);

        const makeMoveTicTacToeRequestModel = props.buildContext.restApi.addModel('MakeMoveModel', {
            contentType: 'application/json',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['id', 'cord', 'player'],
                properties: {
                    id: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                    cord: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        required: ['x', 'y'],
                        properties: {
                            x: {
                                type: apigateway.JsonSchemaType.NUMBER,
                            },
                            y: {
                                type: apigateway.JsonSchemaType.NUMBER,
                            },
                        },
                    },
                    player: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        required: ['id', 'secret'],
                        properties: {
                            id: {
                                type: apigateway.JsonSchemaType.STRING,
                            },
                            secret: {
                                type: apigateway.JsonSchemaType.STRING,
                            },
                        },
                    },
                },
            },
        });

        props.ticTacToeContext.makeMoveResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.makeMoveHandler),
            {
                requestValidator: props.buildContext.restApi.addRequestValidator('MakeMoveValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': makeMoveTicTacToeRequestModel,
                },
            },
        );

        new CfnOutput(this, 'Tic Tac Toe Make Move Path', { value: props.ticTacToeContext.makeMoveResource.path });
    }
}
