import { AppDBClient } from './appDBClient';
import { BDDBClient } from './bcDBClient';
import { EventEventFactory } from './event/model/event-event';


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
            {} // eventRules to be added here
        ];
        await Promise.all(eventRules.map((processor) => processor.process('osmosis')));
    }
}
