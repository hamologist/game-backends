import { Construct } from 'constructs';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { BuildContext } from '../helpers/build-context';
import { NodejsHandlerGenerator } from '../helpers/nodejs-handler-generator';
import { PlayersContext } from './context';
import { PlayersValidate } from './rest-api/validate';
import { PlayersGet } from './rest-api/get';
import { PlayersCreate } from './rest-api/create';
import { WebSocketPlayers } from './web-socket';
import { WebSocketContext } from '../web-socket/context';

export interface PlayersConstructProps {
   buildContext: BuildContext;
}

export class PlayersConstruct extends Construct {
    public readonly playersContext: PlayersContext;

    constructor(scope: Construct, id: string, props: PlayersConstructProps) {
        super(scope, id);

        const playerTable = props.buildContext.tableGenerator.generate('PlayerTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-player`,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id',
            },
            timeToLiveAttribute: 'expirationTime',
        });

        const playerResource = props.buildContext.restApi.root.addResource('player');
        const byIdResource = playerResource.addResource('{id}');

        const nodejsHandlerGenerator = new NodejsHandlerGenerator(this, 'PlayersNodejsHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    PLAYER_TABLE_NAME: playerTable.tableName,
                },
            },
            stageContext: props.buildContext.stageContext,
        });

        this.playersContext = {
            playerResource,
            byIdResource,
            playerTable,
            playerNodejsHandlerGenerator: nodejsHandlerGenerator,
        };

        new PlayersGet(this, 'PlayersGet', {
            playersContext: this.playersContext,
            buildContext: props.buildContext,
        });

        new PlayersCreate(this, 'PlayersCreate', {
            playersContext: this.playersContext,
            buildContext: props.buildContext,
        });

        new PlayersValidate(this, 'PlayersValidate', {
            playersContext: this.playersContext,
            buildContext: props.buildContext,
        });
    }

    public buildWebSocket(webSocketContext: WebSocketContext) {
        new WebSocketPlayers(this, 'WebSocketPlayersStack', {
            playersContext: this.playersContext,
            webSocketContext,
        });
    }
}
