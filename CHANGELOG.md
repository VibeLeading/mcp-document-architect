# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-09-05

### Fixed

- Publish/install packaging: added a `prepare` script so the server builds `dist/` automatically when installed from GitHub (e.g. `npx -y github:VibeLeading/mcp-document-architect`). Previously the `bin` referenced a `dist/index.js` that did not exist on install, causing the process to exit immediately.

## [Unreleased]

### Added

- NOTICE file clarifying MIT-licensed code vs the copyrighted book; expanded README license & attribution section.

## [0.1.0] - 2026-08-31

### Added

- Initial release of the Vibe Leading Document Architect MCP server.
- `list_documents`: list the corporate document trail.
- `read_document`: read a document by path.
- `write_document`: write a document (path-traversal guarded).
- `search_documents`: case-insensitive ranked keyword search.
- `draft_report`: deterministic Mission Script-parsed report outline + scaffolds.
