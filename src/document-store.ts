#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";

export interface DocEntry {
  path: string;
  size: number;
  mtime: string;
}

export interface SearchHit extends DocEntry {
  score: number;
  snippet: string;
}

/**
 * A filesystem-backed document store rooted at `MCP_DOCS_ROOT`
 * (default `~/.vlb-docs`).
 *
 * This is the local backend for the corporate "paper trail". Production
 * deployments should swap in Google Workspace / Office 365 / SharePoint
 * adapters behind the same interface (`list`, `read`, `write`, `search`,
 * `stat`).
 */
export class DocumentStore {
  private readonly root: string;

  constructor() {
    const configured = process.env.MCP_DOCS_ROOT;
    this.root = resolve(
      configured ?? join(homedir(), ".vlb-docs"),
    );
    mkdirSync(this.root, { recursive: true });
  }

  /** Resolve a caller path against the root, rejecting any traversal outside. */
  private resolveWithin(relPath: string): string {
    const target = resolve(this.root, relPath);
    const rel = relative(this.root, target);
    if (rel.startsWith("..") || rel.startsWith(`${sep}..`) || rel === "..") {
      throw new Error(`path escapes document root: "${relPath}"`);
    }
    return target;
  }

  private toRel(absolute: string): string {
    return relative(this.root, absolute).split(sep).join("/");
  }

  list(folder?: string): DocEntry[] {
    const base = folder ? this.resolveWithin(folder) : this.root;
    if (!existsSync(base)) return [];
    const walk = (dir: string): DocEntry[] => {
      const out: DocEntry[] = [];
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) {
          out.push(...walk(full));
        } else {
          out.push({
            path: this.toRel(full),
            size: st.size,
            mtime: st.mtime.toISOString(),
          });
        }
      }
      return out;
    };
    return walk(base);
  }

  read(path: string): string {
    const target = this.resolveWithin(path);
    if (!existsSync(target)) throw new Error(`document not found: "${path}"`);
    return readFileSync(target, "utf8");
  }

  write(path: string, content: string): DocEntry {
    const target = this.resolveWithin(path);
    mkdirSync(resolve(target, ".."), { recursive: true });
    writeFileSync(target, content, "utf8");
    const st = statSync(target);
    return { path: this.toRel(target), size: st.size, mtime: st.mtime.toISOString() };
  }

  stat(path: string): DocEntry {
    const target = this.resolveWithin(path);
    if (!existsSync(target)) throw new Error(`document not found: "${path}"`);
    const st = statSync(target);
    return { path: this.toRel(target), size: st.size, mtime: st.mtime.toISOString() };
  }

  search(query: string, maxResults = 10): SearchHit[] {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    if (terms.length === 0) return [];
    const hits: SearchHit[] = [];
    for (const doc of this.list()) {
      const content = this.read(doc.path);
      const lower = content.toLowerCase();
      let score = 0;
      let snippetStart = -1;
      for (const term of terms) {
        const idx = lower.indexOf(term);
        if (idx >= 0) {
          score += 2;
          if (snippetStart < 0) snippetStart = idx;
        }
        score += (content.match(new RegExp(term, "gi")) ?? []).length;
      }
      // Keyword scoring: title/path words that match carry extra weight.
      score += terms.filter((t) => doc.path.toLowerCase().includes(t)).length * 3;
      if (score > 0) {
        const start = Math.max(0, snippetStart - 40);
        hits.push({
          ...doc,
          score,
          snippet: content.slice(start, start + 120).replace(/\s+/g, " "),
        });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, maxResults);
  }
}
