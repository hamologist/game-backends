import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { CfnOutput } from 'aws-cdk-lib';
import { Resource, ResourceStackProps } from './resource';

export class Players extends Resource {
    public readonly playerTable: dynamodb.Table;
    public readonly createHandler: lambda.Function;
    public readonly getHandler: lambda.Function;
    public readonly validateHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: ResourceStackProps) {
        super(scope, id, props);

        this.playerTable = new dynamodb.Table(this, 'PlayerTable', {
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
                    PLAYER_TABLE_NAME: this.playerTable.tableName,
                },
            },
        }
        this.createHandler = this.handlerGenerator('PlayersCreateHandler', {
            handler: 'players/create.handler',
        });
        this.playerTable.grantWriteData(this.createHandler);

        this.getHandler = this.handlerGenerator('PlayersGetHandler', {
            handler: 'players/get.handler',
        });
        this.playerTable.grantReadData(this.getHandler);

        this.validateHandler = this.handlerGenerator('PlayersValidateHandler', {
            handler: 'players/validate.handler',
        })
        this.playerTable.grantReadData(this.validateHandler);

        const playerResource = props.restApi.root.addResource('player');
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
