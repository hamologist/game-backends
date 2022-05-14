import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class GameBackendsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
    //   code: lambda.Code.fromAsset('src/lambda/layers/shared'),
    // });

    const playerTable = new dynamodb.Table(this, 'PlayerTable', {
      readCapacity: 1,
      writeCapacity: 1,
      partitionKey: {
        type: AttributeType.STRING,
        name: 'id'
      },
    });

    // const createLambda = new NodejsFunction(this, 'TestCreateFunction', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   entry: 'src/lambda/players/create.ts',
    //   handler: 'handler',
    //   bundling: {
    //     minify: false,
    //   },
    //   layers: [sharedLayer],
    // })
    const createLambda = new lambda.Function(this, 'PlayersCreateFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('src/lambda', { exclude: ['*.ts'] }),
      handler: 'players/create.handler',
      environment: {
        PLAYER_TABLE_NAME: playerTable.tableName,
      }
    });
    playerTable.grantWriteData(createLambda);

    const api = new apigateway.RestApi(this,  'Api', {
      defaultCorsPreflightOptions: {
        allowMethods: [
          'OPTIONS',
          'POST'
        ],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowOrigins: ['*']
      }
    });

    const playerResource = api.root.addResource('player');
    playerResource.addMethod(
        'POST',
        new apigateway.LambdaIntegration(createLambda),
    );

    new CfnOutput(this, 'ApiUrl', { value: api.url });
    new CfnOutput(this, 'PlayerUrl', { value: playerResource.path });
  }
}
