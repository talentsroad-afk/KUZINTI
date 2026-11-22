import { useState } from 'react'

/** Fluent Emoji 3D (Microsoft, MIT) served from public npm mirrors; the plain emoji stays visible until the 3D image has loaded, and if it never does. */
// Google Noto animated emoji (CC BY 4.0) for the few that exist animated; Fluent 3D for everything else.
const ANIM = new Set(['1f525', '2728', '1f389', '1f60b', '1f4aa', '2764', '1f44d', '1f44b', '1f4af', '1f680', '1f44f', '1f929', '23f0', '1f4b8', '1f31f', '1f973', '1f60d', '1f924'])
const HOSTS = ['https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/latest/files/assets/', 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/']
const cpOf = (e: string) => { const cps = Array.from(e).map((c) => c.codePointAt(0)!.toString(16)); return (cps.includes('200d') ? cps : cps.filter((c) => c !== 'fe0f')).join('-') }
let host = 0; let animBad = false; let fails = 0 // after many misses on every host, stop trying (keeps the page light offline)
const ok = new Set<string>()

export function E3({ e, className = '' }: { e: string; className?: string }) {
  const cp = cpOf(e); const anim = ANIM.has(cp) && !animBad; const [h, setH] = useState(anim ? -1 : host); const [loaded, setLoaded] = useState(ok.has(e))
  if (!e) return null
  const off = h >= HOSTS.length || fails > 24
  return (
    <span className={`relative inline-grid place-items-center leading-none ${className}`} style={{ width: '1.15em', height: '1.15em' }} role="img" aria-hidden>
      <span className={`transition-opacity duration-300 ${loaded ? 'opacity-0' : ''}`}>{e}</span>
      {!off && <img src={h < 0 ? `https://fonts.gstatic.com/s/e/notoemoji/latest/${cp === '2764' ? '2764_fe0f' : cp}/512.webp` : HOSTS[h] + cp + '.webp'} alt="" draggable={false} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => { ok.add(e); fails = 0; if (h >= 0) host = h; setLoaded(true) }} onError={() => { if (h < 0) { setH(host); return } fails++; setH(h + 1) }} />}
    </span>)
}
