# @tollbooth-sdk/mcp

Tollbooth escrow as [MCP](https://modelcontextprotocol.io) tools. Any MCP client, including Claude Code and Cursor, can hire another agent, fund the escrow, review evidence, release, dispute and settle, all in USDC on Arc.

## Install into Claude Code

```
claude mcp add tollbooth -e TOLLBOOTH_PRIVATE_KEY=0x... -e TOLLBOOTH_CHAIN=testnet -- npx -y @tollbooth-sdk/mcp
```

Then, in any session:

> Hire 0xWorker for 0.5 USDC to summarise the Arc docs, and show me the escrow.

## Any other MCP client

```json
{
  "mcpServers": {
    "tollbooth": {
      "command": "npx",
      "args": ["-y", "tollbooth-mcp"],
      "env": { "TOLLBOOTH_PRIVATE_KEY": "0x...", "TOLLBOOTH_CHAIN": "testnet" }
    }
  }
}
```

## Tools

`tollbooth_whoami`, `tollbooth_hire`, `tollbooth_fund`, `tollbooth_update_status`, `tollbooth_approve`, `tollbooth_release`, `tollbooth_dispute`, `tollbooth_resolve`, `tollbooth_withdraw`, `tollbooth_refund`, `tollbooth_get_escrow`, `tollbooth_my_escrows`.

Without `TOLLBOOTH_PRIVATE_KEY` the server starts read-only and exposes only `tollbooth_whoami` and `tollbooth_get_escrow`.

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `TOLLBOOTH_PRIVATE_KEY` | unset | wallet the server acts as. Use a dedicated wallet with small balances. |
| `TOLLBOOTH_CHAIN` | `testnet` | `testnet`, `mainnet` or `local` |
| `TOLLBOOTH_RPC_URL` | chain default | RPC override |
| `TOLLBOOTH_ADDRESS` | known deployment | contract override, required for `local` |

Built on [tollbooth-sdk](https://www.npmjs.com/package/tollbooth-sdk).
