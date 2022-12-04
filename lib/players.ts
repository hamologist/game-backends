import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { CfnOutput } from 'aws-cdk-lib';
import { HandlerGenerator } from './helpers/handler-generator';
import { BuildContext } from './helpers/build-context';
import { GetPlayer } from './players/get-player';
import { PlayersContext } from './players/players-context';
import { ValidatePlayer } from './players/validate-player';

export interface PlayersProps {
   buildContext: BuildContext;
}

export class Players extends Construct {
    public readonly playersContext: PlayersContext;
    public readonly getPlayer: GetPlayer;
    public readonly validatePlayer: ValidatePlayer;
    public readonly createHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersProps) {
        super(scope, id);

        this.playersContext = new PlayersContext(this, 'PlayersContext', {
            buildContext: props.buildContext,
        });

        const handlerGenerator = new HandlerGenerator(this, 'PlayersHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    PLAYER_TABLE_NAME: this.playersContext.playerTable.tableName,
                },
            },
        });
        this.createHandler = handlerGenerator.generate('PlayersCreateHandler', {
            handler: 'players/create.apiHandler',
        });
        this.playersContext.playerTable.grantWriteData(this.createHandler);

        this.playersContext.playerResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.createHandler),
        );

        this.getPlayer = new GetPlayer(this, 'GetPlayer', {
            playersContext: this.playersContext,
            buildContext: props.buildContext,
        })

        this.validatePlayer = new ValidatePlayer(this, 'ValidatePlayer', {
            playersContext: this.playersContext,
            buildContext: props.buildContext,
        });

        new CfnOutput(this, 'Player Create Path', { value: this.playersContext.playerResource.path });
    }
}
