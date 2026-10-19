# dsh-workspace-lastused

把你最近使用的工作区固定排在 DeepSeek Harness 侧栏第一位，重启后顺序依旧。

[English](./README.md) | 中文

## 做什么

DSH 的工作区顺序存在宿主的持久化注册表里。这个插件监听宿主事件 `api-session/activity`——用户每发一条消息，该会话的列表活动时间就会前进——找到这个会话所属的工作区，用 `workspaceRegistry.insertBefore` 把它挪到当前第一位之前。

顺序是持久化数据，所以重启后它还在第一位。全程不碰界面：没有 DOM 操作、没有插槽替换，侧栏改版基本不会影响它。

## 行为

- 2 秒防抖：连着发几条消息只重排一次。
- 已经在第一位就不动（不写盘）。
- 只统计用户真实发出的消息；仅仅打开工作区、没发消息不会触发重排。
- 置顶的会话仍归官方置顶区，本插件只改工作区顺序。

## 日志

每次真正发生重排，会往 `$DSH_HOME/workspace-lastused.log`（读不到就用 `~/.dsh/workspace-lastused.log`）追加一行，最多保留 200 行。排查"为什么顺序变了"很有用。

```
2026-10-19T03:20:11.402Z promoted "001" above "scratch"
```

## 安装

```bash
dsh plugin --profile <name> add github:DangDangDeng/dsh-workspace-lastused
```

DSH Desktop 的 `desktop` profile 由应用管理，请在 **插件 → 添加插件** 里填 `github:DangDangDeng/dsh-workspace-lastused`。

开发时可以改成指向本地目录：

```bash
dsh plugin --profile <name> add <本目录的绝对路径>
```

## 限制

- 只有"发消息"才会改顺序，单纯切换工作区不算。
- 同一 2 秒窗口里用了两个工作区，只有后一个会话会被提到最前。
- 纯个人偏好插件，不提供任何模型工具。

## 许可证

MIT
