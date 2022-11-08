import { AppDBClient } from './appDBClient';
import { BDDBClient } from './bcDBClient';
import { EventEventFactory } from './event/model/event-event';
import { StakeUnstakeProcessor } from './event/processors/StakeUnstakeProccessor';


export class EventWorker {
    private bddbClient: BDDBClient;

    private appdbClient: AppDBClient;

    constructor(bddbClient: BDDBClient, appdbClient: AppDBClient) {
        this.bddbClient = bddbClient;
        this.appdbClient = appdbClient;
    }

    async start() {
        const eventEventFactory = new EventEventFactory(this.bddbClient);
        const eventRules = [
            new StakeUnstakeProcessor(this.bddbClient, this.appdbClient, eventEventFactory),
        ];
        await Promise.all(eventRules.map((processor) => processor.process('mamaki')));
    }
}
