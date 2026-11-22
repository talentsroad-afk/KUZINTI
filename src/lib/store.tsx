import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Lang } from './i18n'
import { STAPLES } from '../data/catalog'
import type { PlanEntry } from './engine'

export interface User { id: string; name: string; email: string; onboarded: boolean; country: string; city: string; size: number; budget: number; diet: string[]; favs: string[]; xp: number; streak: number; lastDay: string; houseCode?: string }
export interface House { code: string; name: string; members: { id: string; name: string; role: 'owner' | 'member' }[]; plan: Record<string, PlanEntry>; pantry: Record<string, number>; checked: Record<string, boolean>; log: { who: string; msg: string; t: number }[] }
interface DB { users: User[]; houses: Record<string, House> }
export interface Toast { id: number; msg: string; kind: 'xp' | 'info' }

const K = 'kuzinti-db-v1'
const mem: Record<string, string> = {}
const rd = (k: string, s = false) => { try { return (s ? sessionStorage : localStorage).getItem(k) } catch { return mem[(s ? 's' : 'l') + k] ?? null } }
const wr = (k: string, v: string, s = false) => { try { (s ? sessionStorage : localStorage).setItem(k, v) } catch { mem[(s ? 's' : 'l') + k] = v } }
const loadDB = (): DB => { try { return JSON.parse(rd(K) ?? '') as DB } catch { return { users: [], houses: {} } } }
const today = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2, 10)
const mkCode = () => 'KZ-' + Math.random().toString(36).slice(2, 6).toUpperCase()

interface Ctx {
  lang: Lang; setLang: (l: Lang) => void
  me?: User; house?: House
  signup: (name: string, email: string) => void
  login: (email: string) => boolean
  logout: () => void
  patchMe: (p: Partial<User>) => void
  upHouse: (fn: (h: House) => void, log?: string) => void
  createHouse: (name: string) => void
  joinHouse: (code: string) => boolean
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
    upHouse: (fn, log) => commit((d) => {
      const u = d.users.find((x) => x.id === meId); const h = u?.houseCode ? d.houses[u.houseCode] : undefined
      if (!u || !h) return
      fn(h); if (log) h.log = [{ who: u.name, msg: log, t: Date.now() }, ...h.log].slice(0, 20)
    }),
    createHouse: (name) => commit((d) => {
      const u = d.users.find((x) => x.id === meId); if (!u) return
      const code = mkCode()
      d.houses[code] = { code, name, members: [{ id: u.id, name: u.name, role: 'owner' }], plan: {}, pantry: { ...STAPLES }, checked: {}, log: [] }
      u.houseCode = code
    }),
    joinHouse: (code) => {
      const c = code.trim().toUpperCase(); if (!dbRef.current.houses[c]) return false
      commit((d) => {
        const u = d.users.find((x) => x.id === meId); if (!u) return
        u.houseCode = c; const h = d.houses[c]
        if (!h.members.some((m) => m.id === u.id)) h.members.push({ id: u.id, name: u.name, role: 'member' })
        h.log = [{ who: u.name, msg: 'joined', t: Date.now() }, ...h.log].slice(0, 20)
      }); return true
    },
  }), [lang, me, house, toasts, toast, award, patchMe, commit, meId])
  return <C.Provider value={value}>{children}</C.Provider>
}
