import { sha256 } from "@cosmjs/crypto"
import 'dotenv/config';
import { logger } from './helper/logger';
import { BlockWorker, TransactionWorker } from './worker';
import { toHex } from "@cosmjs/encoding"
import { Block, IndexedTx } from "@cosmjs/stargate"
import { writeFile } from "fs/promises"
import { IndexerStargateClient } from "./range-sdk/client"
import { getRpcUrl } from "./range-sdk/util"
import { DbType } from "./database/types"
import { HighNumberTxs } from "./rules/block/highNumberTxsRule";
import { LargeTransfer } from "./rules/transaction/largeTransferRule";
import { CommunityPoolSpend } from "./rules/transaction/communityPoolSpend";
import { SubmitGovProposal } from "./rules/transaction/submitGovProposal";
import { AlertSeverity } from "./range-sdk/alert";


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
        const blockWorker = new BlockWorker(0, [new HighNumberTxs()]);
        const transactionWorker = new TransactionWorker(0, [
            new LargeTransfer(1, AlertSeverity.Info),
            new LargeTransfer(100, AlertSeverity.Low),
            new LargeTransfer(1000, AlertSeverity.Medium),
            new LargeTransfer(10000, AlertSeverity.High),
            new CommunityPoolSpend(AlertSeverity.Info),
            new SubmitGovProposal(AlertSeverity.Info)
        ]);
        setTimeout(poll, 5000, blockWorker, transactionWorker)
    }

    const poll = async (blockWorker: BlockWorker, transactionWorker: TransactionWorker) => {
        const currentHeight = await client.getHeight()
        if (db.status.block.height <= currentHeight - 100)
            console.log(`Catching up ${db.status.block.height}..${currentHeight}`)
        while (db.status.block.height < currentHeight) {
            const processing = db.status.block.height + 1
            process.stdout.cursorTo(0)
            // Get the block
            // console.log(`Processing block ${processing}`)
            const block: Block = await client.getBlock(processing).catch((e) => {
                console.log(`Error getting block ${processing}: ${e}`)
                return block
            })

            /*
            // Process block events  
            const blockEvents: StringEvent[] = await client.getEndBlockEvents(processing).catch((e) => {
                console.log(`Error getting block events ${processing}: ${e}`)
                return []
            })
            */

            console.log(`Handling block: ${block.header.height}. Txs: ${block.txs.length}. Timestamp: ${block.header.time}`)

            // Handle the block
            await blockWorker.process(block).catch((e) => {
                console.log(`Error block-worker processing block ${processing}: ${e}`)
            })

            // extract transactions from block
            const txs = await txsFromBlock(block);

            // Handle the transactions
            txs.forEach(async (tx) => {
                await transactionWorker.process(tx).catch((e) => {
                    console.log(`Error transaction-worker processing tx ${tx.hash}: ${e}`)
                })
            })

            db.status.block.height = processing
        }
        await saveDb()
        timer = setTimeout(poll, pollIntervalMs, blockWorker, transactionWorker)
    }

    const txsFromBlock = async (block: Block): Promise<IndexedTx[]> => {
        const txs: IndexedTx[] = []
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
            txs.push(indexed)
            txIndex++
        }
        return txs
    }

    init()
}

/**
 * Script entrypoint
 */
(async function () {
    logger.info('Start celestia-monitoring-service');
    createIndexer().then(console.log).catch(console.error);
})();
