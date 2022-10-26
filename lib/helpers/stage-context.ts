import { Construct } from 'constructs';

export enum Stage {
    Dev,
    Prod,
}

export interface StageContextProps {
    stage: Stage;
}

export class StageContext extends Construct {
    public readonly stage: Stage;

    constructor(scope: Construct, id: string, props: StageContextProps) {
        super(scope, id);

        this.stage = props.stage;
    }

    public stageToString(): string {
        switch (this.stage) {
            case Stage.Dev:
                return 'dev';
            case Stage.Prod:
                return 'prod';
            default:
                throw new Error('Unknown stage value');
        }
    }
}
