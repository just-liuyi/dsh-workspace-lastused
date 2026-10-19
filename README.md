# dsh-workspace-lastused

Keeps the workspace you just used at the top of the DeepSeek Harness sidebar, and keeps that order across restarts.

English | [中文](./README.zh.md)

## What it does

DSH stores the sidebar workspace order in a durable registry. This plugin listens to the host's `api-session/activity` event — fired whenever a user message advances a Session's list activity — finds the workspace that owns that Session, and moves it before the current first workspace with `workspaceRegistry.insertBefore`.

Because the order is durable, the workspace stays first after a restart. No UI is touched: no DOM, no slot replacement, so a sidebar redesign is unlikely to break it.

## Behavior

- Debounced 2 seconds: a burst of messages reorders once.
- A workspace already first is left alone (no disk write).
- Only user-authored messages count. Merely opening a workspace without sending anything does not reorder it.
- Pinned Sessions keep their own pinned area; this plugin only changes workspace order.

## Log

Every real reorder appends one line to `$DSH_HOME/workspace-lastused.log` (falls back to `~/.dsh/workspace-lastused.log`), trimmed to the last 200 lines. Useful to confirm what moved and why.

```
2026-10-19T03:20:11.402Z promoted "001" above "scratch"
```

## Install

```bash
dsh plugin --profile <name> add github:DangDangDeng/dsh-workspace-lastused
```

In DSH Desktop the `desktop` profile is app-managed, so use **Plugins → Add plugin** with `github:DangDangDeng/dsh-workspace-lastused`.

For development, point the installer at a local checkout instead:

```bash
dsh plugin --profile <name> add <absolute path to this directory>
```

## Limitations

- Order changes only when a message is sent, not when a workspace is merely opened.
- If two workspaces are used within the same 2-second window, only the later Session is promoted.
- It is a personal preference plugin; it exposes no model tools.

## License

MIT
