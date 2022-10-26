import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { CfnOutput } from 'aws-cdk-lib';
import { HandlerGenerator } from './helpers/handler-generator';
import { BuildContext } from './helpers/build-context';

export interface PlayersProps {
   buildContext: BuildContext;
}

export class Players extends Construct {
    public readonly playerTable: dynamodb.Table;
    public readonly createHandler: lambda.Function;
    public readonly getHandler: lambda.Function;
    public readonly validateHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersProps) {
        super(scope, id);

        this.playerTable = props.buildContext.tableGenerator.generate('PlayerTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-player`,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id',
            },
        });

        const handlerGenerator = new HandlerGenerator(this, 'PlayersHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    PLAYER_TABLE_NAME: this.playerTable.tableName,
                },
            },
        });
        this.createHandler = handlerGenerator.generate('PlayersCreateHandler', {
            handler: 'players/create.apiHandler',
        });
        this.playerTable.grantWriteData(this.createHandler);

        this.getHandler = handlerGenerator.generate('PlayersGetHandler', {
            handler: 'players/get.apiHandler',
        });
        this.playerTable.grantReadData(this.getHandler);

        this.validateHandler = handlerGenerator.generate('PlayersValidateHandler', {
            handler: 'players/validate.apiHandler',
        })
        this.playerTable.grantReadData(this.validateHandler);

        const playerResource = props.buildContext.restApi.root.addResource('player');
        playerResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.createHandler),
        );

        const byIdResource = playerResource.addResource('{id}');
        byIdResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(this.getHandler),
        );

        const validateResource = playerResource.addResource('validate');
        validateResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.validateHandler),
        );

        new CfnOutput(this, 'Player Create Path', { value: playerResource.path });
        new CfnOutput(this, 'Player Get Path', { value: byIdResource.path });
        new CfnOutput(this, 'Player Validate Path', { value: validateResource.path });
    }
}
