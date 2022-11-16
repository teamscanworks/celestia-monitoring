import { sha256 } from "@cosmjs/crypto"
import 'dotenv/config';
import { sleep } from './helper/sleep';
import { logger } from './helper/logger';
import { toHex } from "@cosmjs/encoding"
import { Block, IndexedTx } from "@cosmjs/stargate"
import { ABCIMessageLog, Attribute, StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { config } from "dotenv"
import { writeFile } from "fs/promises"
import { IndexerStargateClient } from "./range-sdk/client"
import { getRangeConfig, getRpcUrl } from "./range-sdk/util"
import { DbType } from "./database/types"


export const createIndexer = async () => {
    const dbFile = `${process.cwd()}/src/db.json`
    const db: DbType = require(dbFile)
    const pollIntervalMs = 5_000 // 5 seconds
    let timer: NodeJS.Timer | undefined
    let client: IndexerStargateClient

    const saveDb = async () => {
        await writeFile(dbFile, JSON.stringify(db, null, 4))
    }

    const init = async () => {
        const rpcUrl = getRpcUrl();
        console.log(`Connecting to ${rpcUrl}`);
        client = await IndexerStargateClient.connect(rpcUrl);
        console.log("Connected to chain-id:", await client.getChainId());
        setTimeout(poll, 1000)
    }

    const poll = async () => {
        const currentHeight = await client.getHeight()
        if (db.status.block.height <= currentHeight - 100)
            console.log(`Catching up ${db.status.block.height}..${currentHeight}`)
        while (db.status.block.height < currentHeight) {
            const processing = db.status.block.height + 1
            process.stdout.cursorTo(0)
            // Get the block
            console.log(`Processing block ${processing}`)
            const block: Block = await client.getBlock(processing).catch((e) => {
                console.log(`Error getting block ${processing}: ${e}`)
                return block
            })

            const blockEvents: StringEvent[] = await client.getEndBlockEvents(processing).catch((e) => {
                console.log(`Error getting block events ${processing}: ${e}`)
                return []
            })

            process.stdout.write(`Handling block: ${block.header.height}. Txs: ${block.txs.length}. Block events: ${blockEvents.length} Timestamp: ${block.header.time}`)

            // Handle the block
            await handleBlock(block)
            db.status.block.height = processing
        }
        await saveDb()
        timer = setTimeout(poll, pollIntervalMs)
    }

    const handleBlock = async (block: Block) => {
        if (0 < block.txs.length) console.log("")
        let txIndex = 0
        while (txIndex < block.txs.length) {
            const txHash: string = toHex(sha256(block.txs[txIndex])).toUpperCase()
            const indexed: IndexedTx | null = await client.getTx(txHash).catch((e) => {
                console.log(`Error getting tx ${txHash}: ${e}`)
                return null
            })
            if (!indexed) {
                txIndex++
                continue
            }
            await handleTx(indexed)
            txIndex++
        }
        const events: StringEvent[] = await client.getEndBlockEvents(block.header.height).catch((e) => {
            console.log(`Error getting block events ${block.header.height}: ${e}`)
            return []
        })

        if (0 < events.length) console.log("")
        await handleEvents(events)
    }

    const handleTx = async (indexed: IndexedTx) => {
        const rawLog: any = JSON.parse(indexed.rawLog)
        const events: StringEvent[] = rawLog.flatMap((log: ABCIMessageLog) => log.events)
        await handleEvents(events)
    }

    const handleEvents = async (events: StringEvent[]): Promise<void> => {
        try {
            let eventIndex = 0
            while (eventIndex < events.length) {
                await handleEvent(events[eventIndex])
                eventIndex++
            }
        } catch (e) {
            // Skipping if the handling failed. Most likely the transaction failed.
        }
    }

    const handleEvent = async (event: StringEvent): Promise<void> => {
        handleEventLog(event)
    }

    const getAttributeValueByKey = (attributes: Attribute[], key: string): string | undefined => {
        return attributes.find((attribute: Attribute) => attribute.key === key)?.value
    }

    const handleEventLog = async (event: StringEvent): Promise<void> => {
        //const newId: string | undefined = getAttributeValueByKey(event.attributes, "game-index")
        console.log(`Event: ${event.type}`)
        console.log(`Attributes: ${JSON.stringify(event.attributes, null, '\t')}`)
    }

    init()
}


/*
process.on("SIGINT", () => {
    if (timer) clearTimeout(timer)
    saveDb()
        .then(() => {
            console.log(`${dbFile} saved`)
        })
        .catch(console.error)
        .finally(() => {
            server.close(() => {
                console.log("server closed")
                process.exit(0)
            })
        })
})
*/



/**
 * Script entrypoint
 */
(async function () {
    logger.info('Start celestia-monitoring-service');
    createIndexer().then(console.log).catch(console.error);
})();
