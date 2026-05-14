const DEFAULT_TTL_MS = 5 * 60 * 1000

const store = new Map<string, number>()

function sweep(now: number): void {
  for (const [key, expiresAt] of store) {
    if (expiresAt <= now) store.delete(key)
  }
}

export function checkAndRecord(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
  const now = Date.now()
  if (store.size > 1000) sweep(now)
  const expiresAt = store.get(key)
  if (expiresAt && expiresAt > now) return true
  store.set(key, now + ttlMs)
  return false
}

export function _resetForTests(): void {
  store.clear()
}
