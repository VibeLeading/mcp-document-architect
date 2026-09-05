# mcp-document-architect

The Ecosystem Connector.

An MCP server granting NPC Agents read/write access to the corporate **paper trail**
so their reports and cross-references always align with the Pilot's **Mission Script**
(the high-fidelity strategic intent: outcome, scope, constraints, verification).

## Context

Agents acting inside the corporate ecosystem need a stable, shared document layer and
a drafting discipline. This server:

- exposes a document store of the corporate trail (`list` / `read` / `write` / `search`), and
- turns a Mission Script into a structured report **outline + section scaffolds**, each
  annotated with the requirement it must fulfill, so drafts stay aligned to intent.

## Installation

```bash
npm install -g mcp-document-architect
# or run directly without installing:
npx mcp-document-architect
# or run straight from the GitHub source (builds automatically):
npx -y github:VibeLeading/mcp-document-architect
```

## Requirements

- **Node.js >= 22** — required. The server is ESM-only and uses modern Node
  built-ins. On older Node versions the process fails to start, which MCP
  clients report generically as "connection closed".
- No other runtime dependencies — everything ships with the package.

## Client configuration

Add to your MCP client config (e.g. Claude Code `.mcp.json` or Cursor `mcp.json`):

```json
{
  "mcpServers": {
    "document-architect": {
      "command": "npx",
      "args": ["mcp-document-architect"]
    }
  }
}
```

## Tools

| Tool               | Description                                              | Key args                          |
|--------------------|----------------------------------------------------------|-----------------------------------|
| `list_documents`   | List documents in the paper trail                        | `folder?`                         |
| `read_document`    | Read a document by path                                  | `path`                            |
| `write_document`   | Create/overwrite a document (guarded, UTF-8)             | `path`, `content`                 |
| `search_documents` | Case-insensitive ranked keyword search                   | `query`, `max_results?`           |
| `draft_report`     | Mission Script → structured outline + scaffolds          | `title`, `mission_script`, `sections?` |

## Environment variables

| Variable        | Default        | Purpose                                  |
|-----------------|----------------|------------------------------------------|
| `MCP_DOCS_ROOT` | `~/.vlb-docs`  | Root directory of the document store      |

Paths are resolved against the document root; any path that escapes the root is
rejected (traversal-guarded).

## Production adapters

The backend is intentionally swappable. `src/document-store.ts` defines a single
interface (`list` / `read` / `write` / `search` / `stat`) that a Google Workspace,
Office 365, or SharePoint adapter can implement in place of the local filesystem
store. Similarly, `src/drafter.ts` emits a normalized outline that an LLM provider
can expand into full prose.

## Drafting a Mission Script

A mission script is plain text; the engine heuristically parses `outcome`, `scope`,
`constraints`, and `verification` lines, then emits a deterministic outline with
scaffolds and alignment notes.

Example:
```text
Outcome: Ship the Q3 revenue report.
Scope: Q3 actuals, regional breakdown, forecast deltas.
Constraints: Accounting sign-off required; max 5 pages.
Verification: Numbers reconcile to the general ledger.
```

## Publishing

Published to the npm registry via **OIDC trusted publishing** — no npm tokens stored
anywhere. Pushing a version tag triggers the `.github/workflows/publish.yml` workflow:

```bash
npm version patch -m "release: v%s"
git push origin main --follow-tags
```

- **One-time bootstrap.** The very first published version cannot use trusted
  publishing (the trust relationship attaches to an existing package). Publish
  `0.1.1` once manually (`npm publish` after `npm login`, or a short-lived
  publish-scoped token), then configure **Trusted Publisher** on npmjs.com → the
  package → Settings → Trusted publishing → GitHub Actions → owner
  `VibeLeading`, repo `mcp-document-architect`, workflow `publish.yml`, action
  `allow npm publish` (requires 2FA once per package).
- Requires **Node.js >= 22** and npm >= 11.5.1 on the runner (handled by the workflow).

## License & Attribution

MIT — Copyright (c) 2026 Jean Machuca (see [LICENSE](LICENSE)).

This server implements concepts from the book **_Vibe Leading The AI: The Corporate Race
Against Machines_** by Jean Machuca (ISBN 9798252505008, © 2026 Jean Machuca). The book
is copyrighted commercial material; this repository does not republish its text. Buy the
book at [https://vibeleading.org](https://vibeleading.org) or
[https://a.co/d/04L5YatK](https://a.co/d/04L5YatK). Author website: [jeanmachuca.com](https://jeanmachuca.com) · Support on GitHub Sponsors: [github.com/sponsors/jeanmachuca](https://github.com/sponsors/jeanmachuca). See [NOTICE](NOTICE).
