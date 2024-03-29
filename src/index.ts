import { sha256 } from "@cosmjs/crypto";
import 'dotenv/config';
import { logger } from './helper/logger';
import { BlockWorker, TransactionWorker } from './worker';
import { toHex } from "@cosmjs/encoding";
import { cyan } from "chalk";
import { Block, IndexedTx } from "@cosmjs/stargate";
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci";
import { writeFile } from "fs/promises";
import { IndexerStargateClient } from "./range-sdk/client";
import { getRpcUrl } from "./range-sdk/util";
import { AlertSeverity } from "./range-sdk/alert";
import { DbType } from "./database/types";
import { HighNumberTxs } from "./rules/block/highNumberTxsRule";
import { LargeTransfer } from "./rules/transaction/largeTransferRule";
import { LargeDelegation } from "./rules/transaction/largeDelegationRule";
import { LargeRedelegation } from "./rules/transaction/largeRedelegationRule";
import { CommunityPoolSpend } from "./rules/transaction/communityPoolSpend";
import { SubmitGovProposal } from "./rules/transaction/submitGovProposal";
import { NewValidatorRule } from "./rules/transaction/newValidator";
import { EditValidatorRule } from "./rules/transaction/editValidatorRule";
import { ValidatorUnjailed } from "./rules/transaction/validatorUnjailed";
import { DoubleSignEvidence } from "./rules/transaction/doubleSignEvidenceRule";
import { SoftwareUpgradeRule } from "./rules/transaction/softwareUpgradeRule";
import { QGBAttestationRequest } from "./rules/block/QGBAttestationRequest";
import { PayForData } from "./rules/transaction/payForData";
import { LargeUnstake } from "./rules/transaction/unstakeRule";



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
        const blockWorker = new BlockWorker(0, [
            new HighNumberTxs(),
            new QGBAttestationRequest(AlertSeverity.Info)
        ]);
        const transactionWorker = new TransactionWorker(0, [
            new LargeTransfer(10, AlertSeverity.Info),
            new LargeTransfer(100, AlertSeverity.Low),
            new LargeTransfer(1000, AlertSeverity.Medium),
            new LargeTransfer(10000, AlertSeverity.High),
            new LargeDelegation(10, AlertSeverity.Info),
            new LargeDelegation(100, AlertSeverity.Low),
            new LargeDelegation(1000, AlertSeverity.Medium),
            new LargeDelegation(10000, AlertSeverity.High),
            new LargeRedelegation(10, AlertSeverity.Info),
            new LargeRedelegation(100, AlertSeverity.Low),
            new LargeRedelegation(1000, AlertSeverity.Medium),
            new LargeRedelegation(10000, AlertSeverity.High),
            new LargeUnstake(10, AlertSeverity.Info),
            new LargeUnstake(100, AlertSeverity.Low),
            new LargeUnstake(1000, AlertSeverity.Medium),
            new LargeUnstake(10000, AlertSeverity.High),
            new CommunityPoolSpend(AlertSeverity.Info),
            new SubmitGovProposal(AlertSeverity.Info),
            new NewValidatorRule(AlertSeverity.Info),
            new EditValidatorRule(AlertSeverity.Low),
            new ValidatorUnjailed(AlertSeverity.Low),
            new SoftwareUpgradeRule(AlertSeverity.Medium),
            new DoubleSignEvidence(AlertSeverity.High),
            new PayForData(AlertSeverity.Info)
        ]);
        setTimeout(poll, 7000, blockWorker, transactionWorker)
    }

    const poll = async (blockWorker: BlockWorker, transactionWorker: TransactionWorker) => {
        const currentHeight = await client.getHeight()
        if (db.status.block.height <= currentHeight - 100)
            console.log(`Catching up ${db.status.block.height}..${currentHeight}`)
        while (db.status.block.height < currentHeight) {
            const processing = db.status.block.height + 1
            process.stdout.cursorTo(0)
            // Get the block
            const block: Block = await client.getBlock(processing).catch((e) => {
                console.log(`Error getting block ${processing}: ${e}`)
                return block
            })

            // Process block events  
            const blockEvents: StringEvent[] = await client.getEndBlockEvents(processing).catch((e) => {
                console.log(`Error getting block events ${processing}: ${e}`)
                return []
            })

            console.log(cyan(`Handling block: ${block.header.height}. Txs: ${block.txs.length}. Timestamp: ${block.header.time}`))

            // Handle the block
            await blockWorker.process(block, blockEvents).catch((e) => {
                console.log(`Error block-worker processing block ${processing}: ${e}`)
            })

            // extract transactions from block
            const txs = await txsFromBlock(block);
            console.log(`Found ${txs.length} transactions in block ${processing}`)

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
            //console.log(`Getting tx ${txHash}`)
            const indexed: IndexedTx | null = await client.getTx(txHash).catch((e) => {
                console.log(`Error getting tx ${txHash}: ${e}`)
                return null
            })
            //console.log(`Indexed ${indexed}`)
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
