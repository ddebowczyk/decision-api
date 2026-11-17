---
title: classifier.dev MCP setup
description: Install classifier.dev tools and skills in your AI agent, step by step.
canonical: https://classifier.dev/mcp-setup
last-updated: 2026-09-22
---

# classifier.dev MCP

Use classifier.dev inside ChatGPT, Claude, Claude Code, Codex, Cursor, Muse Code, Gemini CLI, Grok Build and other agents. Two stateless Streamable HTTP servers are available for public, keyless use:

```
https://classifier.dev/mcp         tools: classify_texts, classify_dimensions, classify_multi_label,
                                   count_labels, review_uncertain
https://classifier.dev/mcp/docs    tools: list_docs, read_doc, search_docs,
                                   get_examples
```

## Quick install for coding clients

Neon add-mcp detects supported clients and writes their MCP configuration. Run these in your project and select the same clients for both servers:

```bash
npx add-mcp@2.4.1 https://classifier.dev/mcp --name classifier
npx add-mcp@2.4.1 https://classifier.dev/mcp/docs --name classifier-docs
```

This installs tools in Claude Code, Codex, Cursor, VS Code/Copilot, Gemini CLI, Grok Build, Windsurf, Cline, Goose, Kiro, OpenCode, Zed and other supported clients. It does not install cloud apps or the bundled skill. Inspect the proposed scope before confirming: selecting a global-only client makes every selected install global. Use the native Gemini bundle below. Choose either MCP setup or a plugin in each client to avoid duplicate tools. Source and supported clients: https://github.com/neon-solutions/add-mcp

For plugins with the bulk-classify skill, clone the repository and run:

```bash
npm run package:plugins
```

This produces separate Claude, Codex, Muse Code, Gemini CLI and portable Agent Plugins bundles under dist/plugins. Install instructions and downloads: https://github.com/mrmps/classifier-dev/tree/main/plugins/classifier

Classification requests are retained for training and operator review by default. Set share_data: false in tool arguments to opt out. The plugin skill explains this choice. See https://classifier.dev/privacy.

## Workspace connections

To attribute classification requests to your workspace, use a workspace API key in the Authorization: Bearer header on /mcp. The Default key and named keys work with both the API and MCP. Manage them at /app/keys; client-specific setup is at /app/agents. The keyless examples below use public limits and do not appear in your workspace's activity or usage.

For workspace setup in Claude Code:

```bash
claude mcp add --transport http classifier https://classifier.dev/mcp --header "Authorization: Bearer YOUR_API_KEY"
```

For Codex, set CLASSIFIER_API_KEY securely in the environment, then run:

```bash
codex mcp add classifier --url https://classifier.dev/mcp --bearer-token-env-var CLASSIFIER_API_KEY
```

For Cursor, set CLASSIFIER_API_KEY in the environment inherited by Cursor:

```json
{"mcpServers": {"classifier": {"url": "https://classifier.dev/mcp", "headers": {"Authorization": "Bearer ${env:CLASSIFIER_API_KEY}"}}}}
```

Hosted OAuth connections to your workspace are not available yet. The ChatGPT and Claude app instructions below connect to the public service.

Server card: https://classifier.dev/.well-known/mcp/server-card.json (also at https://classifier.dev/mcp/server-card; the docs server's at https://classifier.dev/mcp/docs/server-card) Registry: listed in the official MCP registry as dev.classifier/classifier — https://registry.modelcontextprotocol.io/v0/servers?search=dev.classifier

## Claude app and claude desktop

Pro and Max: Customize > Connectors > "+" > Add custom connector. Paste https://classifier.dev/mcp as the remote MCP server URL, leave the OAuth fields empty, click Add. Then in any chat open the "+" menu > Connectors and switch classifier.dev on.

Team and Enterprise: an Owner adds it first under Organization settings > Connectors > Add > Custom > Web, same URL; members then find it under Customize > Connectors and click Connect.

The docs server works the same way with https://classifier.dev/mcp/docs.

## Claude Code

```bash
claude mcp add --transport http classifier https://classifier.dev/mcp
claude mcp add --transport http classifier-docs https://classifier.dev/mcp/docs
```

Or in .mcp.json at the root of a project, so the whole team gets it:

```json
{"mcpServers": {"classifier": {"type": "http", "url": "https://classifier.dev/mcp"}}}
```

Or as a plugin, which adds both servers and the bulk-classify skill at once:

```bash
claude plugin marketplace add mrmps/classifier-dev
claude plugin install classifier@classifier-dev
```

## ChatGPT

Turn on developer mode: Settings > Security and login > Developer mode. Then Settings > Apps & Connectors (or the "+" in the composer) > Create, name it classifier, URL https://classifier.dev/mcp, authentication "No Authentication", and create. It appears under Drafts; toggle its tools on. In a chat pick Developer mode from the "+" menu and select the app.

Classification tools declare their data-sharing and external-service side effects; the host controls approval prompts. This server exposes classification tools, not the search/fetch interface used by deep-research connectors.

## Codex

```bash
codex mcp add classifier --url https://classifier.dev/mcp
```

Or as a plugin, with the skill included:

```bash
codex plugin marketplace add https://github.com/mrmps/classifier-dev
codex plugin add classifier@classifier-dev
```

Or in ~/.codex/config.toml:

```
[mcp_servers.classifier]
url = "https://classifier.dev/mcp"
```

## Muse code

From the cloned repository, build and install the native Muse Code bundle:

```bash
npm run package:plugins
export MUSE_EXPERIMENTAL_PLUGINS=1
muse plugins install ./dist/plugins/muse/classifier --scope user
muse plugins approve classifier
```

Restart Muse Code and check /mcp. Install the generated directory: Muse rejects plugin folders containing multiple supported manifests.

## Gemini CLI

After npm run package:plugins in the cloned repository:

```
gemini extensions install ./dist/plugins/gemini/classifier
```

Restart Gemini CLI and check /mcp and /skills. Both servers use httpUrl for Streamable HTTP, and the extension includes the shared bulk-classify skill.

## Grok build and grok bot

Grok Build reads Claude-compatible plugins. After packaging, run:

```
grok --plugin-dir ./dist/plugins/claude/classifier
```

Grok Bot is hosted and uses Cursor's plugin infrastructure. Its Connect apps screen installs directory or team-available connectors. The local CLI bundle does not install into Grok Bot. Our hosted MCP endpoint and plugin package are prepared for submission; listing requires platform review or team setup. https://cursor.com/help/grok-bot/connect-plugins

## Muse app

The consumer Muse app uses connectors separately from Muse Code plugins. Ask Muse to create a custom connector using these public API resources:

```
https://classifier.dev/openapi.json
https://classifier.dev/skill.md
```

Use synthetic data and share_data: false for the first request. Confirm a successful classification before treating the connector as ready. Public directory distribution requires review at https://muse.ai/platform.

## Cursor, VS Code, windsurf, goose, anything else

Cursor also accepts the portable Agent Plugins bundle: copy dist/plugins/portable/classifier into ~/.cursor/plugins/local/classifier after packaging, then reload Cursor and inspect Customize. Local imports may be disabled by team policy. Review an existing folder before replacing it.

For clients with Streamable HTTP support, the usual MCP JSON:

```json
{"mcpServers": {"classifier": {"url": "https://classifier.dev/mcp"}}}
```

Cursor: Settings > MCP > Add new global MCP server, or .cursor/mcp.json. VS Code: .vscode/mcp.json with {"servers": {"classifier": {"type": "http", "url": "https://classifier.dev/mcp"}}}.

## Try it by hand

```bash
curl https://classifier.dev/mcp -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

```bash
curl https://classifier.dev/mcp -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 2, "method": "tools/call",
    "params": {
      "name": "classify_texts",
      "arguments": {
        "inputs": ["Win a free iPhone", "Lunch at 1?"],
        "labels": ["spam", "not spam"]
      }
    }
  }'
```

Or with the official inspector: npx @modelcontextprotocol/inspector --cli https://classifier.dev/mcp --method tools/list

## What the tools do

```
classify_texts        one label per text, with confidence when available; up to 1,000 texts
classify_dimensions   one decision per named dimension, with per-field confidence
classify_multi_label  every label that applies per text, a score per label
count_labels          just the histogram — how many texts landed on each label
review_uncertain      only the texts the model was unsure about, with the runner-up label
```

Confidence can be null when the model does not provide a score. All five classification tools are neither read-only nor idempotent: calls consume quota or billed usage and retain training data unless share_data is false. They return both text and structuredContent. Errors from the API come back as a tool result with isError, so the model can read the message and try again; malformed arguments are JSON-RPC -32602 with the problem spelled out.

## Protocol notes

Streamable HTTP per the 2025-11-25 specification, negotiating down to 2025-03-26. Stateless: no Mcp-Session-Id, every POST stands alone, GET answers 405 because there is no server-initiated stream. Batched JSON-RPC arrays are accepted. Same per-IP limits as the REST API; a 429 carries Retry-After. Source: https://github.com/mrmps/classifier-dev/blob/main/src/mcp.ts
