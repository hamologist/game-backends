import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../../players';
import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { TicTacToeContext } from '../context';

export interface TicTacToeJoinGameProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
    ticTacToeContext: TicTacToeContext;
}

export class TicTacToeJoinGame extends Construct {
    public readonly joinGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeJoinGameProps) {
        super(scope, id);

        this.joinGameHandler = props.ticTacToeContext.gameStateNodejsHandlerGenerator.generate('TicTacToeJoinGameHandler', {
            entry: 'src/lambda/tic-tac-toe/join-game.ts',
            handler: 'apiHandler',
            functionName: 'TicTacToeJoinGameRestHandler',
        });
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.joinGameHandler);
        props.playersContext.playerTable.grantReadData(this.joinGameHandler);

        const joinGameTicTacToeRequestModel = props.buildContext.restApi.addModel('JoinGameModel', {
            contentType: 'application/json',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['id', 'player'],
                properties: {
                    id: {
                        type: apigateway.JsonSchemaType.STRING,
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

        props.ticTacToeContext.joinGameResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.joinGameHandler),
            {
                requestValidator: props.buildContext.restApi.addRequestValidator('JoinGameValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': joinGameTicTacToeRequestModel,
                },
            },
        );

        new CfnOutput(this, 'Tic Tac Toe Join Game Path', { value: props.ticTacToeContext.joinGameResource.path });
    }
}
