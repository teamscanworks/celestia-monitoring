# celestia-monitoring

Celestia monitoring is a real-time monitoring and alerting system for Celestia blockchain.

## Workflow

Each rule has its own offset (height) from which messages are scanned. Currently, this offset is stored in AppDB database table "RuleOffset". This is the general workflow:

1. `AlertRule`s are read from AppDB.
2. For each `AlertRule`, `offset` is fetched from `AppDB.RuleOffset`.
3. Non-processed transaction `Message`s (where `height` > `offset`) are fetched from BDDB.
4. For each `Message`, if it matches with the rule conditions, a new `AlertEvent` is stored.
5. New `AlertRule` `offset` is stored.

## CLI Tool

CLI development admin tool can be run with:

```
$ yarn cli [operation]
```

All the operations are available at src/cli/cli.ts.

## Events 

When a new Event type is created, a new row must be created in `EventRuleOffset` table with the `eventName` and the current offset. Otherwise, event processor will try to fetch messages from block number 1.

## Local development

You can use local port forwarding to access bddb: ssh -o ExitOnForwardFailure=yes -N -L 5433:34.76.105.86:5432 root@monitor.scanworks.org

This is necessary because bddb is protected by a firewall that whitelists only certain IP addresses. Since your local IP address might change, it cannot be permanently whitelisted. The solution for this problem is indirect access via local port forwarding through monitor.scanworks.org which has a whitelisted static IP.
