import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../../players';
import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { TicTacToeContext } from '../context';

export interface TicTacToeNewGameProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
    ticTacToeContext: TicTacToeContext;
}

export class TicTacToeNewGame extends Construct {
    public readonly newGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeNewGameProps) {
        super(scope, id);

        this.newGameHandler = props.ticTacToeContext.gameStateNodejsHandlerGenerator.generate('TicTacToeNewGameHandler', {
            entry: 'src/lambda/tic-tac-toe/new-game.ts',
            handler: 'apiHandler',
            functionName: 'TicTacToeNewGameRestHandler',
        });
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.newGameHandler);
        props.playersContext.playerTable.grantReadData(this.newGameHandler);

        const newGameTicTacToeRequestModel = props.buildContext.restApi.addModel('NewGameModel', {
            contentType: 'application/json',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['player'],
                properties: {
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

        props.ticTacToeContext.newGameResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.newGameHandler),
            {
                requestValidator: props.buildContext.restApi.addRequestValidator('NewGameValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': newGameTicTacToeRequestModel,
                },
            },
        );

        new CfnOutput(this, 'Tic Tac Toe New Game Path', { value: props.ticTacToeContext.newGameResource.path });
    }
}
