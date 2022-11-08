import { BDDBClient } from './bcDBClient';

export class BDDBClientProvider {

    constructor(
        //private readonly mainNetBddbClient: BDDBClient,
        private readonly testNetBddbClient: BDDBClient,
    ) { }

    getClient(network: string): BDDBClient {
        if (network == 'mamaki') {
            return this.testNetBddbClient;
        }
        throw new Error('invalid network');
    }

}
