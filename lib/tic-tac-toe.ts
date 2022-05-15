import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { CfnOutput } from 'aws-cdk-lib';
import { Resource, ResourceStackProps } from './resource';

export interface TicTacToeProps extends ResourceStackProps{
    playerTable: dynamodb.Table;
}

export class TicTacToe extends Resource {
    public readonly gameStateTable: dynamodb.Table;
    public readonly getHandler: lambda.Function;
    public readonly joinGameHandler: lambda.Function;
    public readonly makeMoveHandler: lambda.Function;
    public readonly newGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeProps) {
        super(scope, id, props);

        this.gameStateTable = new dynamodb.Table(this, 'GameStateTable', {
            readCapacity: 1,
            writeCapacity: 1,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id'
            },
        });

        this.defaultLambdaGeneratorProps = {
            ...this.defaultLambdaGeneratorProps,
            ...{
                environment: {
                    GAME_STATE_TABLE_NAME: this.gameStateTable.tableName,
                    PLAYER_TABLE_NAME: props.playerTable.tableName,
                },
            },
        }
        this.getHandler = this.handlerGenerator('TicTacToeGetHandler', {
            handler: 'tic-tac-toe/get.handler',
        });
        this.gameStateTable.grantReadData(this.getHandler);

        this.joinGameHandler = this.handlerGenerator('TicTacToeJoinGameHandler', {
            handler: 'tic-tac-toe/join-game.handler',
        });
        this.gameStateTable.grantReadWriteData(this.joinGameHandler);
        props.playerTable.grantReadData(this.joinGameHandler);

        this.makeMoveHandler = this.handlerGenerator('TicTacToeMakeMoveHandler', {
            handler: 'tic-tac-toe/make-move.handler',
        })
        this.gameStateTable.grantReadWriteData(this.makeMoveHandler);
        props.playerTable.grantReadData(this.makeMoveHandler);

        this.newGameHandler = this.handlerGenerator('TicTacToeNewGameHandler', {
            handler: 'tic-tac-toe/new-game.handler',
        })
        this.gameStateTable.grantReadWriteData(this.newGameHandler);
        props.playerTable.grantReadData(this.newGameHandler);

        const ticTacToeResource = props.restApi.root.addResource('tic-tac-toe');
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
