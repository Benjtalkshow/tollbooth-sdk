#!/usr/bin/env node
/**
 * tollbooth-mcp — Tollbooth escrow as MCP tools.
 *
 * Env:
 *   TOLLBOOTH_PRIVATE_KEY   hex key of the wallet this server acts as (omit for read-only)
 *   TOLLBOOTH_CHAIN         testnet (default) | mainnet | local
 *   TOLLBOOTH_RPC_URL       optional RPC override
 *   TOLLBOOTH_ADDRESS       optional contract override (required for local)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { TollboothClient, TOLLBOOTH_AGENT_TOOLS, runTollboothTool, arc, arcTestnet, formatUsdc } from 'tollbooth-sdk'

const localChain = defineChain({ id: 31337, name: 'Anvil (local)', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: [process.env.TOLLBOOTH_RPC_URL ?? 'http://127.0.0.1:8545'] } } })
const chainName = process.env.TOLLBOOTH_CHAIN ?? 'testnet'
const chain = chainName === 'mainnet' ? arc : chainName === 'local' ? localChain : arcTestnet
const rpc = process.env.TOLLBOOTH_RPC_URL
const pk = process.env.TOLLBOOTH_PRIVATE_KEY as Hex | undefined

const publicClient = createPublicClient({ chain, transport: http(rpc) })
const walletClient = pk ? createWalletClient({ account: privateKeyToAccount(pk), chain, transport: http(rpc) }) : undefined
const tb = new TollboothClient({ publicClient, walletClient, address: process.env.TOLLBOOTH_ADDRESS as Hex | undefined })

const READ_ONLY = new Set(['tollbooth_get_escrow'])
const WHOAMI = {
  name: 'tollbooth_whoami',
  description: 'Show which wallet this Tollbooth server acts as, the network, the contract address, and the USDC balance.',
  input_schema: { type: 'object', properties: {} },
}

const server = new Server({ name: 'tollbooth', version: '0.1.0' }, { capabilities: { tools: {} } })

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [WHOAMI, ...TOLLBOOTH_AGENT_TOOLS]
    .filter(t => walletClient || READ_ONLY.has(t.name) || t.name === 'tollbooth_whoami')
    .map(t => ({ name: t.name, description: t.description, inputSchema: t.input_schema as { type: 'object'; [k: string]: unknown } })),
}))

server.setRequestHandler(CallToolRequestSchema, async req => {
  const name = req.params.name
  const input = (req.params.arguments ?? {}) as Record<string, unknown>
  try {
    if (name === 'tollbooth_whoami') {
      const account = walletClient?.account.address
      const out = {
        network: chain.name,
        chainId: chain.id,
        contract: tb.address,
        wallet: account ?? null,
        usdcBalance: account ? formatUsdc(await tb.usdcBalance(account)) : null,
        mode: account ? 'read-write' : 'read-only (set TOLLBOOTH_PRIVATE_KEY to act)',
      }
      return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
    }
    if (!walletClient && !READ_ONLY.has(name)) throw new Error('This server is read-only. Set TOLLBOOTH_PRIVATE_KEY to perform onchain actions.')
    const out = await runTollboothTool(tb, name, input)
    return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }] }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
