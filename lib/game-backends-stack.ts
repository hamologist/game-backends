import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { PlayersStack } from './players-stack';
import { TicTacToeStack } from './tic-tac-toe-stack';

export class GameBackendsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const restApi = new apigateway.RestApi(this,  'Api', {
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

    const playersStack = new PlayersStack(this, 'PlayersStack', {
      restApi
    });

    new TicTacToeStack(this, 'TicTacToeStack', {
      restApi,
      playerTable: playersStack.playerTable,
    })

    new CfnOutput(this, 'ApiUrl', { value: restApi.url });
  }
}
