import { cloudOn, getHouse, putHouse } from './cloud'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Lang } from './i18n'
import { STAPLES } from '../data/catalog'
import type { PlanEntry } from './engine'

export interface User { id: string; name: string; email: string; onboarded: boolean; country: string; city: string; size: number; budget: number; diet: string[]; favs: string[]; xp: number; streak: number; lastDay: string; houseCode?: string; mode?: 'light' | 'balanced' | 'gourmet'; cuisine?: string; region?: string; goals?: string[]; meals?: ('b' | 'l' | 'd' | 'g')[]; kcal?: number; steps?: Record<string, number>; showForme?: boolean; money?: MoneyData }
export interface MoneyData { inc: { id: string; n: string; a: number }[]; fix: Record<string, number>; env: Record<string, number>; exp: { id: string; t: number; c: string; a: number; n: string }[]; goal?: { n: string; target: number; monthly: number; saved: number }; since: number; prog?: Record<string, boolean> }
export interface Trip { t: number; store?: string; total: number; items: { n: string; q: string; p: number }[]; missed: number }
export interface House { code: string; name: string; members: { id: string; name: string; role: 'owner' | 'member' }[]; plan: Record<string, PlanEntry>; pantry: Record<string, number>; checked: Record<string, boolean>; extras?: Record<string, number>; qty?: Record<string, number>; store?: string; paid?: Record<string, number>; home?: Record<string, number>; custom?: { id: string; name: string; qty: string; price: number; note: string; e?: string }[]; listDay?: number; missing?: Record<string, boolean>; trips?: Trip[]; log: { who: string; msg: string; t: number }[] }
interface DB { users: User[]; houses: Record<string, House> }
export interface Toast { id: number; msg: string; kind: 'xp' | 'info' }

const K = 'kuzinti-db-v1'
const mem: Record<string, string> = {}
const rd = (k: string, s = false) => { try { return (s ? sessionStorage : localStorage).getItem(k) } catch { return mem[(s ? 's' : 'l') + k] ?? null } }
const wr = (k: string, v: string, s = false) => { try { (s ? sessionStorage : localStorage).setItem(k, v) } catch { mem[(s ? 's' : 'l') + k] = v } }
const loadDB = (): DB => { try { return JSON.parse(rd(K) ?? '') as DB } catch { return { users: [], houses: {} } } }
const today = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2, 10)
const mkCode = () => 'KZ-' + Math.random().toString(36).slice(2, 8).toUpperCase()

interface Ctx {
  lang: Lang; setLang: (l: Lang) => void
  me?: User; house?: House
  signup: (name: string, email: string) => void
  login: (email: string) => boolean
  logout: () => void
  patchMe: (p: Partial<User>) => void
  upHouse: (fn: (h: House) => void, log?: string) => void
  createHouse: (name: string) => void
  joinHouse: (code: string) => Promise<boolean>
  award: (xp: number, msg: string) => void
  toasts: Toast[]; toast: (msg: string, kind?: Toast['kind']) => void
}
const C = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(C)

export function Provider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB)
  const [id, setId] = useState<string | null>(() => rd('kuzinti-uid', true))
  const [lang, setLangS] = useState<Lang>(() => (rd('kuzinti-lang') as Lang) || 'fr')
  const [toasts, setToasts] = useState<Toast[]>([])
  const n = useRef(0)
  const dbRef = useRef(db); dbRef.current = db

  // Cross-tab sync: another tab (your partner) writes the same store, we re-read it live.
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === K) setDb(loadDB()) }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])
  // Cloud sync: poll the shared household every 3 s; local writes are re-applied on the latest copy, then pushed.
  const pending = useRef(0)
  const code = db.users.find((u) => u.id === id)?.houseCode
  useEffect(() => {
    if (!cloudOn || !code) return
    let stop = false
    const pull = async () => {
      if (pending.current) return
      try {
        const remote = await getHouse<House>(code)
        if (stop || pending.current) return
        if (!remote) { const h = dbRef.current.houses[code]; if (h) await putHouse(code, h); return }
        if (JSON.stringify(remote) !== JSON.stringify(dbRef.current.houses[code])) commit((d) => { d.houses[code] = remote })
      } catch { /* offline: keep local */ }
    }
    pull(); const t = setInterval(pull, 3000)
    return () => { stop = true; clearInterval(t) }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps
  const pushHouse = useCallback(async (c: string, fn?: (h: House) => void) => {
    if (!cloudOn) return
    pending.current++
    try {
      let h = dbRef.current.houses[c]
      if (fn) { const remote = await getHouse<House>(c).catch(() => null); if (remote) { fn(remote); h = remote; commit((d) => { d.houses[c] = remote }) } }
      if (h) await putHouse(c, h)
    } catch { /* retry on next change */ } finally { pending.current-- }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr' }, [lang])

  const commit = useCallback((fn: (d: DB) => void) => {
    const next: DB = JSON.parse(JSON.stringify(dbRef.current)); fn(next)
    wr(K, JSON.stringify(next)); dbRef.current = next; setDb(next)
  }, [])
  const toast = useCallback((msg: string, kind: Toast['kind'] = 'info') => {
    const i = ++n.current; setToasts((t) => [...t.slice(-1), { id: i, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== i)), 3200)
  }, [])

  const me = db.users.find((u) => u.id === id)
  const house = me?.houseCode ? db.houses[me.houseCode] : undefined
  const meId = me?.id
  const patchMe = useCallback((p: Partial<User>) => commit((d) => { const u = d.users.find((x) => x.id === meId); if (u) Object.assign(u, p) }), [commit, meId])

  const award = useCallback((xp: number, msg: string) => {
    commit((d) => {
      const u = d.users.find((x) => x.id === meId); if (!u) return
      u.xp += xp
      const day = today()
      if (u.lastDay !== day) {
        const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
        u.streak = u.lastDay === y ? u.streak + 1 : 1; u.lastDay = day
      }
    })
    toast(`+${xp} XP · ${msg}`, 'xp')
  }, [commit, meId, toast])

  const value: Ctx = useMemo(() => ({
    lang, setLang: (l) => { wr('kuzinti-lang', l); setLangS(l) },
    me, house, toasts, toast, award, patchMe,
    signup: (name, email) => {
      const u: User = { id: uid(), name, email: email.toLowerCase(), onboarded: false, country: 'MA', city: 'Casablanca', size: 2, budget: 800, diet: [], favs: [], xp: 0, streak: 0, lastDay: '' }
      commit((d) => { d.users.push(u) }); wr('kuzinti-uid', u.id, true); setId(u.id)
    },
    login: (email) => { const u = dbRef.current.users.find((x) => x.email === email.toLowerCase()); if (!u) return false; wr('kuzinti-uid', u.id, true); setId(u.id); return true },
    logout: () => { try { sessionStorage.removeItem('kuzinti-uid') } catch { /* ignore */ } setId(null) },
    upHouse: (fn, log) => {
      const u = dbRef.current.users.find((x) => x.id === meId); const c = u?.houseCode; if (!u || !c || !dbRef.current.houses[c]) return
      const apply = (h: House) => { fn(h); if (log) h.log = [{ who: u.name, msg: log, t: Date.now() }, ...h.log].slice(0, 20) }
      commit((d) => apply(d.houses[c])); pushHouse(c, apply)
    },
    createHouse: (name) => commit((d) => {
      const u = d.users.find((x) => x.id === meId); if (!u) return
      const code = mkCode()
      d.houses[code] = { code, name, members: [{ id: u.id, name: u.name, role: 'owner' }], plan: {}, pantry: { ...STAPLES }, checked: {}, extras: { tea: 200, mint: 80, bread: 7, milk: 1000 }, log: [] }
      u.houseCode = code; setTimeout(() => pushHouse(code))
    }),
    joinHouse: async (code) => {
      const c = code.trim().toUpperCase()
      if (cloudOn) { const remote = await getHouse<House>(c).catch(() => null); if (remote) commit((d) => { d.houses[c] = remote }) }
      if (!dbRef.current.houses[c]) return false
      commit((d) => {
        const u = d.users.find((x) => x.id === meId); if (!u) return
        u.houseCode = c; const h = d.houses[c]
        if (!h.members.some((m) => m.id === u.id)) h.members.push({ id: u.id, name: u.name, role: 'member' })
        h.log = [{ who: u.name, msg: 'joined', t: Date.now() }, ...h.log].slice(0, 20)
      }); pushHouse(c, (h) => { const u = dbRef.current.users.find((x) => x.id === meId)!; if (!h.members.some((m) => m.id === u.id)) h.members.push({ id: u.id, name: u.name, role: 'member' }) }); return true
    },
  }), [lang, me, house, toasts, toast, award, patchMe, commit, meId, pushHouse])
  return <C.Provider value={value}>{children}</C.Provider>
}
