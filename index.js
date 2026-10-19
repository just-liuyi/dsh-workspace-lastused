/**
 * dsh-workspace-lastused — Host half.
 *
 * 把「最近使用的工作区」自动排到侧栏工作区列表的第一位。
 *
 * 信号：宿主事件 `api-session/activity(sessionId, updatedAt)` —— 用户每发一条消息，
 * 该会话的列表活动时间就会前进。我们据此找到会话所属的工作区，用
 * `workspaceRegistry.insertBefore(id, first)` 把它挪到最前。
 *
 * 顺序写在宿主的持久化注册表里，所以重启后依然是第一位——这正是需求
 * 「下次打开软件能立刻定位我的工作区」。
 *
 * 设计取舍：
 *   - 只动数据顺序，不碰界面（没有 DOM、没有插槽替换），DSH 升级基本不会坏；
 *   - 2 秒防抖：连续发消息只排一次，避免列表反复跳动；
 *   - 已经在第一位就不写盘；
 *   - 每次真正重排写一行日志到 `$DSH_HOME/workspace-lastused.log`，方便排查。
 */

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 连续活动合并窗口；够短，用户发完消息就能看到顺序变化。 */
const DEBOUNCE_MS = 2000
/** 日志超过这个字节数就裁到最近 200 行。 */
const LOG_LIMIT_BYTES = 64 * 1024

export const inject = ['workspaceRegistry']

export function apply(ctx) {
  const registry = ctx.workspaceRegistry
  let timer = null
  let pendingSession = null
  let chain = Promise.resolve()

  const logFile = () => join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'workspace-lastused.log')

  async function note(line) {
    try {
      const file = logFile()
      await mkdir(dirname(file), { recursive: true })
      await appendFile(file, `${new Date().toISOString()} ${line}\n`, 'utf8')
      const text = await readFile(file, 'utf8')
      if (text.length > LOG_LIMIT_BYTES) {
        await writeFile(file, `${text.trim().split('\n').slice(-200).join('\n')}\n`, 'utf8')
      }
    } catch {
      /* 日志是辅助手段，失败不影响排序 */
    }
  }

  async function promote(sessionId) {
    const workspaces = registry.list()
    if (!workspaces.length) return
    const target = workspaces.find((workspace) => workspace.sessionIds.includes(sessionId))
    if (!target) {
      await note(`session ${sessionId}: no workspace (skipped)`)
      return
    }
    const first = workspaces[0]
    if (!first || first.id === target.id) {
      await note(`kept "${target.title}" (already first)`)
      return
    }
    await registry.insertBefore(target.id, first.id)
    await note(`promoted "${target.title}" above "${first.title}"`)
  }

  ctx.on('api-session/activity', (sessionId) => {
    pendingSession = sessionId
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const id = pendingSession
      pendingSession = null
      if (!id) return
      // 串行执行：并发 insertBefore 会互相覆盖顺序。
      chain = chain.then(() => promote(id)).catch(() => {})
    }, DEBOUNCE_MS)
  })

  ctx.effect(
    () => () => {
      if (timer) clearTimeout(timer)
      timer = null
    },
    'workspace-lastused: pending timer',
  )
}
