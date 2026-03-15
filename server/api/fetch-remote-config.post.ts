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
