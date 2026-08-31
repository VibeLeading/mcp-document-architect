#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { DocumentStore } from "./document-store.js";
import { DraftEngine } from "./drafter.js";

async function main() {
  const docs = new DocumentStore();
  const drafter = new DraftEngine();

  const server = new McpServer({
    name: "mcp-document-architect",
    version: "0.1.0",
  });

  server.tool(
    "list_documents",
    "Lists documents in the corporate paper trail within an optional folder.",
    { folder: z.string().optional() },
    async ({ folder }) => {
      const entries = docs.list(folder);
      return {
        content: [{ type: "text", text: JSON.stringify(entries, null, 2) }],
      };
    },
  );

  server.tool(
    "read_document",
    "Reads the content of a document by path.",
    { path: z.string() },
    async ({ path }) => {
      try {
        const content = docs.read(path);
        return {
          content: [{ type: "text", text: content }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  server.tool(
    "write_document",
    "Creates or overwrites a document (path-traversal guarded, UTF-8).",
    { path: z.string(), content: z.string() },
    async ({ path, content }) => {
      try {
        const stat = docs.write(path, content);
        return {
          content: [{ type: "text", text: JSON.stringify(stat) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: (err as Error).message }],
        };
      }
    },
  );

  server.tool(
    "search_documents",
    "Searches the paper trail with case-insensitive substring and keyword scoring.",
    { query: z.string(), max_results: z.number().int().positive().optional() },
    async ({ query, max_results }) => {
      const results = docs.search(query, max_results ?? 10);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    },
  );

  server.tool(
    "draft_report",
    "Produces a structured report draft (outline + scaffolds + alignment notes) from a Mission Script.",
    {
      title: z.string(),
      mission_script: z.string(),
      sections: z.array(z.string()).optional(),
    },
    async ({ title, mission_script, sections }) => {
      const draft = drafter.draft(title, mission_script, sections);
      return {
        content: [{ type: "text", text: JSON.stringify(draft, null, 2) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[mcp-document-architect] fatal:", err);
  process.exit(1);
});
