import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../../players';
import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { TicTacToeContext } from '../context';

export interface TicTacToeGetProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
    ticTacToeContext: TicTacToeContext;
}

export class TicTacToeGet extends Construct {
    public readonly getHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeGetProps) {
        super(scope, id);

        this.getHandler = props.ticTacToeContext.gameStateNodejsHandlerGenerator.generate('TicTacToeGetHandler', {
            entry: 'src/lambda/tic-tac-toe/get.ts',
            handler: 'apiHandler',
        });
        props.ticTacToeContext.gameStateTable.grantReadData(this.getHandler);

        props.ticTacToeContext.byIdResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(this.getHandler),
        );

        new CfnOutput(this, 'Tic Tac Toe Get By Id Path', { value: props.ticTacToeContext.byIdResource.path });
    }
}
