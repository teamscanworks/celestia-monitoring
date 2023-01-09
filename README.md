# celestia-monitoring

Range is building a real-time monitoring and alerting platorm for the IBC ecosystem.

This repository extends Range to support Celetia and the rollups that post data to it.

Currently, the only supported network is `arabica-2`. Since Arabica is highly experimental, we are not using a permanent DB and just index block heights and transactions on demand.

## Range SDK

The `range-sdk` is a library that contains useful types to create alert rules and alert events, and utils to index and parse blocks, transactions and events. It also contains a `client` class that makes easier connecting to a Celestia RPC and setting-up an indexer client.

## Workflow

### Starting height

An example alert indexer implementation can be found in `/src/index.ts`. Currently, we use a temporary db which only contains the last processed height. Changing the `height` value in `src/db.json` we can define at which block number our alert indexer will start.

### Types of alert rules

We currently support two types of alert rules, based on the data sources they need to trigger (or not) the given alert event. The two alert rules types are:

1. **Block rule.** Block alert rules are based on block-level data (e.g. `header`, number of `txs`) and/or block-level events (e.g. events fire at `BeginBlock` or `EndBlock`).
2. **Transaction rule.** Transaction alert rules are based on transaction-level data (e.g. `hash`, `gasUsed`, `gasWanted`, `rawLog`) or transaction messages and events (e.g events fired when a specific message `action` is executed).

### Worker

Each type of alert rule has its own worker, `BlockWorker` and `TransactionWorker`. To include newly create alert rules into our alert indexer, we just need to add the rules into the constructor of the corresponding worker.

## Rules
These are the alert rules we have implemented so far, using the `range-sdk`:

### Block Rules

- **HighNumberTx**. Alert rule that triggers when the number of txs in a given block goes above a certain threshold.
- **QGBAttestationRequest**. Alert rule that triggers whenever there is an `AttestationRequest` from the `qgb` module.

### Transaction Rules

- **LargeTransfer**. Alert rule that triggers when there is a `TIA` transfer with value above a certain threshold. [INFO, LOW, MEDIUM, HIGH] depending on the amount transferred.
- **LargeDelegation**. Alert rule that triggers when a large delegation (staking) event occurs. [INFO, LOW, MEDIUM, HIGH] depending on the alert threshold of the amount delegated.
- **LargeRedelegation**. Alert rule that triggers when a large redelegation occurs. [INFO, LOW, MEDIUM, HIGH] depending on the amount of TIA redelegated.
- **LargeUnstake**. Alert rule that triggers when there is an `undelegate` event above a certain threshold, that may compromise the economic security of the chain. [INFO, LOW, MEDIUM, HIGH] depending on the amount of TIA unstaked.
- **CommunityPoolSpend.** Alert rule that triggers when there is a new spend tx from the Community Pool. [INFO]
- **GovProposal.** Alert rule that triggers when there is a new Governance proposal in Celestia. [INFO]
- **NewValidator.** Alert rule that triggers when a new validator is created in the Celestia blockchain. [INFO]
- **EditValidator.** Alert rule that triggers when the config parameters of a validator have changed. [LOW]
- **ValidatorUnjailed.** Alert rule that triggers when a validator is unjailed. [LOW]
- **SoftwareUpgrade.** Alert rule that triggers when the Celestia blockchain starts a version upgrade. [MEDIUM]
- **DoubleSignEvidence.** Alert rule that triggers when a double-sign evidence is detected. [HIGH]


## CLI

The best way to play with this repo is currently through `npm` commands. Remember to set first the starting `height` in `src/db.json`:

```
$ npm run build
```
and
```
$ npm run start
```
