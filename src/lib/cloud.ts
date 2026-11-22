// Shared household sync through two Supabase RPCs (see supabase/setup.sql).
// Without a URL/key the app stays in local demo mode (e.g. the claude.ai preview).
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
export const cloudOn = !!(URL_ && KEY)

async function rpc<T>(fn: string, body: object): Promise<T> {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', ...(KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${KEY}` }) }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`${fn} ${r.status}`)
  const txt = await r.text(); return (txt ? JSON.parse(txt) : null) as T
}
export const getHouse = <T,>(code: string) => rpc<T | null>('kz_get', { p_code: code })
export const putHouse = (code: string, data: unknown) => rpc<null>('kz_put', { p_code: code, p_data: data })
