import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { CfnOutput } from 'aws-cdk-lib';
import { HandlerGenerator } from './helpers/handler-generator';
import { BuildContext } from './helpers/build-context';

export interface TicTacToeProps {
    buildContext: BuildContext;
    playerTable: dynamodb.Table;
}

export class TicTacToe extends Construct {
    public readonly gameStateTable: dynamodb.Table;
    public readonly getHandler: lambda.Function;
    public readonly joinGameHandler: lambda.Function;
    public readonly makeMoveHandler: lambda.Function;
    public readonly newGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeProps) {
        super(scope, id);

        this.gameStateTable = props.buildContext.tableGenerator.generate('GameStateTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-game-state`,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id',
            },
        });

        const handlerGenerator = new HandlerGenerator(this, 'TicTacToeHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    GAME_STATE_TABLE_NAME: this.gameStateTable.tableName,
                    PLAYER_TABLE_NAME: props.playerTable.tableName,
                },
            },
        });
        this.getHandler = handlerGenerator.generate('TicTacToeGetHandler', {
            handler: 'tic-tac-toe/get.handler',
        });
        this.gameStateTable.grantReadData(this.getHandler);

        this.joinGameHandler = handlerGenerator.generate('TicTacToeJoinGameHandler', {
            handler: 'tic-tac-toe/join-game.handler',
        });
        this.gameStateTable.grantReadWriteData(this.joinGameHandler);
        props.playerTable.grantReadData(this.joinGameHandler);

        this.makeMoveHandler = handlerGenerator.generate('TicTacToeMakeMoveHandler', {
            handler: 'tic-tac-toe/make-move.handler',
        })
        this.gameStateTable.grantReadWriteData(this.makeMoveHandler);
        props.playerTable.grantReadData(this.makeMoveHandler);

        this.newGameHandler = handlerGenerator.generate('TicTacToeNewGameHandler', {
            handler: 'tic-tac-toe/new-game.apiHandler',
        })
        this.gameStateTable.grantReadWriteData(this.newGameHandler);
        props.playerTable.grantReadData(this.newGameHandler);

        const ticTacToeResource = props.buildContext.restApi.root.addResource('tic-tac-toe');
        const byIdResource = ticTacToeResource.addResource('{id}');
        byIdResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(this.getHandler),
        );
        const joinGameResource = ticTacToeResource.addResource('join-game');
        joinGameResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.joinGameHandler),
        );
        const makeMoveResource = ticTacToeResource.addResource('make-move');
        makeMoveResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.makeMoveHandler),
        );
        const newGameResource = ticTacToeResource.addResource('new-game');
        newGameResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.newGameHandler),
        );

        new CfnOutput(this, 'Tic Tac Toe Get By Id Path', { value: byIdResource.path });
        new CfnOutput(this, 'Tic Tac Toe Join Game Path', { value: joinGameResource.path });
        new CfnOutput(this, 'Tic Tac Toe Make Move Path', { value: makeMoveResource.path });
        new CfnOutput(this, 'Tic Tac Toe New Game Path', { value: newGameResource.path });
    }
}
