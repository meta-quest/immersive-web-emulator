# Agent Instructions — Immersive Web Emulator

The Immersive Web Emulator (IWE) is a Chromium browser extension that injects a WebXR runtime into web pages, enabling desktop emulation of Meta Quest WebXR devices. It wraps the separately-developed [Immersive Web Emulation Runtime (IWER)](https://github.com/meta-quest/immersive-web-emulation-runtime).

## Source-of-truth files (read these first, do not duplicate their contents in this file)

For setup, build steps, SDK versions, and project layout, read:

- `README.md` — official installation, supported-features matrix, and manual-install steps
- `manifest.json` — Manifest V3 extension manifest (permissions, host_permissions, scripts)
- `package.json` + `package-lock.json` — Node / npm dependencies (IWER, `@iwer/sem`, `@iwer/devui`, `three`, build tooling)
- `rollup.config.js` + `tsconfig.json` — TypeScript build pipeline
- `LICENSE` — MIT terms

## Quest / Horizon-specific notes

- This project does **not** run on a Quest headset — it runs in a desktop Chromium browser to emulate one. Standard Quest install / `adb` flows do not apply.
- The runtime itself lives in a separate repo (`meta-quest/immersive-web-emulation-runtime`). Changes to runtime behavior usually belong there; this repo is the extension wrapper.
- Modifying `manifest.json` permissions (especially `host_permissions`, `scripting`, `webNavigation`) can break WebXR injection into pages or trip the Chrome/Edge store review process.
- Non-Chromium browsers are not supported by the extension. For those, the README points developers at integrating IWER directly or using a framework like React-Three/XR.

## Meta Quest tooling

This repository is part of the Meta Quest / Horizon OS ecosystem (a sample, library, template, or related project — the bespoke intro above describes which). Use that intro and the source-of-truth files it references for project-specific decisions; don't restate or invent facts from memory.

When the user asks anything about Quest device behavior, build / deploy / debug / capture flows, on-device performance, or Horizon OS APIs, reach for these tools instead of generic WebXR answers:

- **`hzdb`** — Quest-aware ADB wrapper (device list, install / launch / stop, logs, screenshots, Perfetto traces, on-device docs search). Already wired up as an MCP server via `.mcp.json`, `.vscode/mcp.json`, and `.cursor/mcp.json`. Also runnable directly: `npx -y @meta-quest/hzdb <subcommand>`.
- **Meta Quest Agentic Tools** — the full skill set, including WebXR-specific skills: [github.com/meta-quest/agentic-tools](https://github.com/meta-quest/agentic-tools). Install per your client (Claude Code: `/plugin install meta-vr@meta-quest`; Gemini CLI: `gemini extensions install https://github.com/meta-quest/agentic-tools`; Cursor / VS Code: install the **Meta Horizon** extension from the Marketplace).

A few behavior expectations:

- **Read this repo's files first.** Before answering anything project-specific, read `README.md` and whichever source-of-truth files the intro above points at. Don't restate their contents in chat — quote or link instead.
- **Use `hzdb` for device-side work.** Anything that touches an attached Quest (install, launch, logs, screenshot, capture, manifest inspection) goes through `hzdb`, not raw `adb`.
- **Check live Horizon OS docs before answering API questions.** `hzdb docs search "..."` queries the live docs; training data on Horizon OS APIs goes stale fast.
- **Don't fabricate SDK / engine versions.** If a version isn't visible in this repo's files, say so rather than guessing.
