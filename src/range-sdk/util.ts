import { RangeConfig } from ".";
import { fromUtf8 } from "@cosmjs/encoding"
import { Block, IndexedTx } from "@cosmjs/stargate"
import { Attribute as TendermintAttribute, Event } from "@cosmjs/tendermint-rpc"
import { Attribute, StringEvent, ABCIMessageLog } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"

export const getRpcUrl: () => string = () => {
    return process.env.RPC_URL || "https://rpc.limani.celestia-devops.dev" //https://rpc.mamaki.celestia.counterpoint.software" // ;
};

export const getRangeConfig: () => RangeConfig = () => {
    return {
        rpcUrl: getRpcUrl(),
        network: "arabica", // mamaki or arabica
        chainId: 1,
    };
};

export const convertTendermintEvents = (events: readonly Event[]): StringEvent[] => {
    return events.map(
        (event: Event): StringEvent => ({
            type: event.type,
            attributes: event.attributes.map(
                (attribute: TendermintAttribute): Attribute => ({
                    key: fromUtf8(attribute.key),
                    value: fromUtf8(attribute.value),
                }),
            ),
        }),
    )
}

export const parseIndexedTxEvents = (indexed: IndexedTx): StringEvent[] => {
    const rawLog: any = JSON.parse(indexed.rawLog)
    const events: StringEvent[] = rawLog.flatMap((log: ABCIMessageLog) => log.events)
    return events
}


export const getAttributeValueByKey = (attributes: Attribute[], key: string): string | undefined => {
    return attributes.find((attribute: Attribute) => attribute.key === key)?.value
}

export const resolveAmount = (amount: string): { value: number, denom: string } => {
    const amountParts = amount.split('u');
    const amountValue = parseFloat(amountParts[0]) / 1_000_000;
    const amountDenom = amountParts[1].toUpperCase();
    return { value: amountValue, denom: amountDenom };
}
