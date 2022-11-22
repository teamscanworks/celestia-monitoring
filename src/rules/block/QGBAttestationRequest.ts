import { Block } from '@cosmjs/stargate';
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { BlockRule } from './blockRule';
import { AlertFactory, AlertType, AlertSeverity } from '../../range-sdk/alert';
import { parseIndexedTxEvents, getAttributeValueByKey } from '../../range-sdk/util';


export class QGBAttestationRequest extends BlockRule {
    constructor(private severity: AlertSeverity) {
        super();
    }

    async handle(block: Block, events: StringEvent[], factory: AlertFactory): Promise<void> {

        console.log("Processing QGB Attestation Request for block " + block.header.height);

        // find the transfer event
        const message = events.find((event) => event.type === 'AttestationRequest');

        if (message) {
            const nonce = getAttributeValueByKey(message.attributes, 'nonce');

            const alert = factory.create(
                'arabica',
                'active',
                AlertType.Block,
                this.severity,
                [],
                {
                    height: block.header.height,
                    timestamp: block.header.time,
                    nonce: nonce,
                },
                new Date(),
                true
            );

            factory.pprint(alert, this.getRuleName(), this.getRuleDescription());

        }
    }

    getRuleDescription(): string {
        return 'A new QGB Attestation Request was submitted';
    }

    getRuleName(): string {
        return 'QGBAttestationRequest';
    }
}