import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url?: string }>(event)
  const url = body?.url

  if (!url || typeof url !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'url is required in request body',
    })
  }

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  try {
    const text = await $fetch<string>(url, {
      responseType: 'text',
      timeout: 30_000,
      headers: { 'User-Agent': 'clash.meta' },
    })

    // 如果配置了 mihomoConfigPath，将远程配置持久化到磁盘
    const config = useRuntimeConfig()
    const configPath = config.mihomoConfigPath

    if (configPath) {
      const resolved = resolve(configPath)
      try {
        copyFileSync(resolved, `${resolved}.bak`)
      } catch {
        // 文件不存在则跳过备份
      }
      mkdirSync(dirname(resolved), { recursive: true })
      writeFileSync(resolved, text, 'utf-8')
    }

    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    return text
  } catch (error: unknown) {
    const err = error as Record<string, unknown> | null
    const status =
      (err?.response as Record<string, unknown>)?.status ??
      err?.statusCode ??
      502
    const msg = err?.message ?? 'Unknown error'
    console.error('[fetch-remote-config]', url, msg)
    throw createError({
      statusCode: Number(status),
      message: `Failed to fetch remote config: ${msg}`,
    })
  }
})
