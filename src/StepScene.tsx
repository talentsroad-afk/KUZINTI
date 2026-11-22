import { useEffect, useState } from 'react'

type Act = 'chop' | 'mix' | 'fry' | 'boil' | 'oven' | 'serve' | 'rest' | 'add' | 'prep'
const RX: [Act, RegExp][] = [
  ['serve', /serv|dress|présent|garni|plate|décor|قدم/i],
  ['oven', /four|rôti|roti|gratin|enfourn|bake|roast|oven|فرن/i],
  ['chop', /coup|émin|emin|hach|tranch|dés\b|râp|rap[ée]|épluch|pel[ée]|cut|chop|slice|dice|grate|peel|قطع|فرم/i],
  ['mix', /mélang|melang|fouett|incorpor|pétri|petri|battre|bats|mix|whisk|stir|knead|combine|اخلط|خلط/i],
  ['fry', /revenir|poêl|poel|frire|frit|dor[ée]|saisi|griller|grill|fry|sauté|saute|brown|sear|toast|قل/i],
  ['boil', /mijot|bouill|cuire|cuisson|cuit|vapeur|simmer|boil|cook|steam|poach|طه|اطبخ/i],
  ['add', /ajout|versez|verser|incorpor|add|pour|أضف/i],
  ['rest', /repos|marin|frais|frigo|refroid|laisser|rest|chill|marinat|cool|soak|اترك/i],
]
export const actOf = (t: string): Act => RX.find(([, r]) => r.test(t))?.[0] ?? 'prep'
export const ACT_LABEL: Record<Act, [string, string, string]> = {
  chop: ['Chop', 'Découper', 'قطّع'], mix: ['Mix', 'Mélanger', 'اخلط'], fry: ['Sauté', 'Faire revenir', 'شوّح'], boil: ['Simmer', 'Mijoter', 'اطهُ'],
  oven: ['Bake', 'Au four', 'في الفرن'], serve: ['Serve', 'Servir', 'قدّم'], rest: ['Rest', 'Laisser reposer', 'اترك'], add: ['Add', 'Ajouter', 'أضف'], prep: ['Prepare', 'Préparer', 'حضّر'],
}

export type SceneIng = { e: string; c?: boolean; l?: boolean; s?: boolean; n?: string }
const LIQ: [RegExp, string, string][] = [[/huile|oil|زيت/i, '🫒', '#e3b21c'], [/\beau\b|water|ماء/i, '💧', '#79c6ff'], [/lait|milk|حليب/i, '🥛', '#fffaf0'], [/bouillon|stock|broth/i, '🍵', '#c9853a'], [/crème|cream/i, '🥛', '#fff3d6'], [/vinaigre|vinegar/i, '🍷', '#a33'], [/sauce soja|soy/i, '🍶', '#3b2312'], [/citron|lemon|ليمون/i, '🍋', '#f7e35a']]
const SPICE = /épice|epice|sel\b|poivre|cumin|paprika|curcuma|gingembre|cannelle|ras el|herbes|persil|coriandre|spice|salt|pepper|herb|توابل|ملح/i
const DOT = ['#d9472b', '#e0a526', '#7a4a21', '#2f7d32', '#f5f5f5']

/** Drawn ingredient: shape and colours guessed from the ingredient's emoji (no emoji in the scene itself). */
type Shape = { k: 'round' | 'long' | 'meat' | 'fish' | 'leaf' | 'bulb' | 'grain' | 'egg'; c: string; d: string }
const SH: [RegExp, Shape][] = [
  [/🍅|🍎|🍒/u, { k: 'round', c: '#e5483b', d: '#b72f25' }], [/🧅/u, { k: 'bulb', c: '#c58ac9', d: '#8d4f93' }], [/🧄/u, { k: 'bulb', c: '#f3efe4', d: '#cfc6b0' }],
  [/🥕/u, { k: 'long', c: '#f28a24', d: '#c8650d' }], [/🍆/u, { k: 'long', c: '#6b3f9c', d: '#47266e' }], [/🥒|🥬|🫛/u, { k: 'long', c: '#5fa548', d: '#3c7a2c' }],
  [/🫑|🌶/u, { k: 'round', c: '#3fa34d', d: '#26752f' }], [/🥔|🍠/u, { k: 'round', c: '#c9a066', d: '#9c773f' }], [/🍋|🍊|🍑/u, { k: 'round', c: '#f4cf3a', d: '#c9a313' }],
  [/🥩|🍖|🥓/u, { k: 'meat', c: '#d4676d', d: '#a53e44' }], [/🍗|🐔/u, { k: 'meat', c: '#f0b27a', d: '#c9814a' }], [/🐟|🐠|🦐|🦑|🐙/u, { k: 'fish', c: '#9fbad0', d: '#6c8ba6' }],
  [/🌿|🥗|🍃|🌱/u, { k: 'leaf', c: '#4f9a46', d: '#2f6b29' }], [/🥚/u, { k: 'egg', c: '#fff7e6', d: '#f2c14e' }], [/🍚|🍝|🌾|🫘|🥜|🌰|🧀|🧈/u, { k: 'grain', c: '#f1d79a', d: '#c9a85f' }],
]
const shapeOf = (e: string): Shape => SH.find(([r]) => r.test(e))?.[1] ?? { k: 'round', c: '#8fc46a', d: '#5e9440' }
function Food({ s, x, y, sc = 1 }: { s: Shape; x: number; y: number; sc?: number }) {
  const t = `translate(${x} ${y}) scale(${sc})`
  if (s.k === 'long') return <g transform={t}><rect x={-22} y={-7} width={44} height={14} rx={7} fill={s.c} /><rect x={-22} y={-7} width={44} height={5} rx={3} fill="#fff" opacity=".25" /><path d="M22 -2 l8 -6 M22 0 l9 0 M22 2 l8 6" stroke="#4f9a46" strokeWidth="3" strokeLinecap="round" /></g>
  if (s.k === 'meat') return <g transform={t}><path d="M-20 4 C-24 -12 4 -18 18 -8 C26 -2 20 12 4 12 C-8 12 -18 12 -20 4Z" fill={s.c} /><path d="M-12 -2 C-4 -8 8 -6 12 0" stroke="#fff" strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" /></g>
  if (s.k === 'fish') return <g transform={t}><ellipse rx={20} ry={10} fill={s.c} /><path d="M18 0 l12 -9 v18z" fill={s.d} /><circle cx={-11} cy={-2} r={2.2} fill="#1d2a33" /></g>
  if (s.k === 'leaf') return <g transform={t}><path d="M-14 8 C-16 -10 6 -16 16 -12 C14 0 4 12 -14 8Z" fill={s.c} /><path d="M-12 6 L12 -10" stroke={s.d} strokeWidth="1.6" /></g>
  if (s.k === 'bulb') return <g transform={t}><path d="M0 -18 C6 -10 16 -4 15 6 C14 14 7 16 0 16 C-7 16 -14 14 -15 6 C-16 -4 -6 -10 0 -18Z" fill={s.c} /><path d="M0 -18 v-6" stroke="#6f8f3a" strokeWidth="3" strokeLinecap="round" /><path d="M-6 -6 C-8 2 -7 10 -4 14 M6 -6 C8 2 7 10 4 14" stroke={s.d} strokeWidth="1.4" fill="none" opacity=".6" /></g>
  if (s.k === 'grain') return <g transform={t}>{[[-8, 2], [0, -4], [8, 2], [-3, 6], [5, 7], [-10, -4], [10, -5]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={3.5} ry={2.2} fill={i % 2 ? s.c : s.d} />)}</g>
  if (s.k === 'egg') return <g transform={t}><ellipse rx={12} ry={15} fill={s.c} stroke="#e8dcc0" /></g>
  return <g transform={t}><circle r={16} fill={s.c} /><circle cx={-5} cy={-6} r={5} fill="#fff" opacity=".35" /><path d="M-3 -16 q3 -6 8 -4" stroke="#4f9a46" strokeWidth="3" fill="none" strokeLinecap="round" /></g>
}
function Slices({ s, x, y }: { s: Shape; x: number; y: number }) {
  return <g>{[-14, 0, 14].map((dx, i) => <g key={i} className="slice-pop" style={{ animationDelay: `${i * 50}ms` }}><g transform={`translate(${x + dx} ${y + (i % 2) * 3}) rotate(${(i - 1) * 18})`}>
    {s.k === 'long' || s.k === 'round' || s.k === 'bulb' ? <><ellipse rx={7.5} ry={6.5} fill={s.c} /><ellipse rx={4.5} ry={3.8} fill="#fff" opacity=".35" /></> : <rect x={-6} y={-5} width={12} height={10} rx={3} fill={s.c} />}
  </g></g>)}</g>
}

/** The chef, drawn in SVG: he chops, cries over onions, pours, stirs, sweats at the pan and blows a kiss at the end. */
function Chef({ mood, arm, hand }: { mood: 'happy' | 'cry' | 'sweat' | 'proud' | 'focus'; arm: 'chop' | 'idle'; hand: 'pour' | 'stir' | 'shake' | 'kiss' | 'idle' }) {
  return (
    <g className={`chef mood-${mood}`}>
      <g className="chef-sway">
        {/* body */}
        <path d="M118 182 C116 140 128 118 160 116 C192 118 204 140 202 182Z" fill="#fff" stroke="#e5e0d4" strokeWidth="2" />
        <path d="M148 120 L160 140 L172 120" fill="#e5483b" />
        <circle cx="160" cy="152" r="2.6" fill="#d8d1c2" /><circle cx="160" cy="166" r="2.6" fill="#d8d1c2" />
        {/* head */}
        <g className="chef-head">
          <circle cx="160" cy="92" r="26" fill="#f3c49b" />
          <ellipse cx="135" cy="94" rx="5" ry="7" fill="#eab088" /><ellipse cx="185" cy="94" rx="5" ry="7" fill="#eab088" />
          {/* toque */}
          <g className="toque"><rect x="140" y="56" width="40" height="14" rx="3" fill="#fff" stroke="#e5e0d4" strokeWidth="2" /><circle cx="146" cy="50" r="12" fill="#fff" /><circle cx="160" cy="42" r="15" fill="#fff" /><circle cx="174" cy="50" r="12" fill="#fff" /></g>
          {/* eyes */}
          <g className="eyes-open"><ellipse cx="150" cy="90" rx="3.4" ry="4.4" fill="#2b1d14" /><ellipse cx="170" cy="90" rx="3.4" ry="4.4" fill="#2b1d14" /><circle cx="151" cy="88.5" r="1.1" fill="#fff" /><circle cx="171" cy="88.5" r="1.1" fill="#fff" /></g>
          <g className="eyes-shut"><path d="M145 91 q5 -4 10 0 M165 91 q5 -4 10 0" stroke="#2b1d14" strokeWidth="2.6" fill="none" strokeLinecap="round" /></g>
          <path className="brows" d="M144 81 l11 -2 M165 79 l11 2" stroke="#6b4428" strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="143" cy="100" rx="5" ry="3" fill="#ef9a8a" opacity=".6" /><ellipse cx="177" cy="100" rx="5" ry="3" fill="#ef9a8a" opacity=".6" />
          <ellipse cx="160" cy="98" rx="4" ry="3.4" fill="#e8a37c" />
          {/* mustache */}
          <path className="stache" d="M160 103 C152 99 142 101 138 108 C146 106 152 108 160 106 C168 108 174 106 182 108 C178 101 168 99 160 103Z" fill="#5a3620" />
          <path className="mouth-happy" d="M153 110 q7 6 14 0" stroke="#7a2e2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse className="mouth-o" cx="160" cy="112" rx="4" ry="5" fill="#7a2e2a" />
          {/* tears & sweat */}
          <g className="tears">{[0, 1, 2].map((k) => <path key={k} className="tear" style={{ animationDelay: `${k * 0.28}s` }} d="M148 94 q-6 10 0 14 q6 -4 0 -14Z" fill="#6fc3ff" stroke="#fff" strokeWidth=".8" />)}{[0, 1, 2].map((k) => <path key={'r' + k} className="tear" style={{ animationDelay: `${k * 0.28 + 0.14}s` }} d="M172 94 q-6 10 0 14 q6 -4 0 -14Z" fill="#6fc3ff" stroke="#fff" strokeWidth=".8" />)}</g>
          <path className="sweat" d="M188 74 q-5 8 0 11 q5 -3 0 -11Z" fill="#9ad8ff" />
        </g>
        {/* left arm (screen left): knife over the board */}
        <g className={`arm-l arm-${arm}`}><path d="M128 130 L104 160" stroke="#fff" strokeWidth="15" strokeLinecap="round" /><circle cx="102" cy="162" r="8" fill="#f3c49b" />
          <g transform="translate(102 162) rotate(-8)"><rect x="-3" y="-4" width="12" height="8" rx="2" fill="#3b2a20" /><path d="M-3 -4 L-40 -2 C-42 2 -40 6 -36 6 L-3 4Z" fill="#dfe6ea" stroke="#aab4ba" /></g></g>
        {/* right arm (screen right): pours, stirs, shakes, kisses */}
        <g className={`arm-r hand-${hand}`}><path d="M192 130 L216 152" stroke="#fff" strokeWidth="15" strokeLinecap="round" /><circle cx="218" cy="154" r="8" fill="#f3c49b" />
          {hand === 'stir' && <rect x="216" y="132" width="5" height="44" rx="2.5" fill="#b98652" transform="rotate(20 218 154)" />}
          {hand === 'shake' && <g transform="translate(218 140)"><rect x="-8" y="-14" width="16" height="22" rx="4" fill="#f5f5f5" stroke="#cfcfcf" /><rect x="-8" y="-18" width="16" height="6" rx="2" fill="#9aa5ad" /></g>}
          {hand === 'pour' && <g transform="translate(222 140)"><rect x="-8" y="-20" width="16" height="28" rx="5" fill="#cfe9d4" stroke="#8fbf9a" /><rect x="-3" y="-30" width="6" height="12" rx="2" fill="#8fbf9a" /></g>}
        </g>
        {hand === 'kiss' && <path className="heart" d="M226 98 c-6 -8 -18 -2 -12 8 l12 10 l12 -10 c6 -10 -6 -16 -12 -8z" fill="#ff5a6e" />}
      </g>
    </g>)
}

/** The step acted out by the chef: the real ingredients get chopped on the board, jump into the pot, oil and water are poured, spices shaken, then it cooks. */
export function StepScene({ text, ings }: { text: string; ings: SceneIng[] }) {
  const a = actOf(text); const solid = ings.filter((x) => !x.l && !x.s); const its = solid.slice(0, 3); const cut = its.map((x) => !!x.c && a !== 'serve')
  const n = cut.filter(Boolean).length
  const pours = LIQ.filter(([rx]) => rx.test(text) || ings.some((x) => x.l && rx.test(x.n ?? ''))).slice(0, 2)
  const spice = SPICE.test(text) || ings.some((x) => x.s)
  const P0 = n + 2; const S0 = P0 + pours.length; const COOK = S0 + (spice ? 1 : 0)
  const [t, setT] = useState(0)
  useEffect(() => { setT(0); const ids: number[] = []; const C = 900; let at = 500
    for (let k = 1; k <= n; k++) { ids.push(window.setTimeout(() => setT(k), at + C * 0.6)); at += C }
    at += 150; ids.push(window.setTimeout(() => setT(n + 1), at)); at += its.length ? 1000 : 200
    for (let k = 0; k < pours.length; k++) { ids.push(window.setTimeout(() => setT(P0 + k), at)); at += 1500 }
    if (spice) { ids.push(window.setTimeout(() => setT(S0), at)); at += 1300 }
    ids.push(window.setTimeout(() => setT(COOK + 1), at))
    return () => ids.forEach(clearTimeout) }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  const fly = t >= n + 1; const cook = t > COOK; const pourK = t >= P0 && t < S0 ? t - P0 : -1; const shaking = spice && t === S0
  const order = its.map((_, i) => cut.slice(0, i + 1).filter(Boolean).length)
  const chopping = n > 0 && t < n; const cur = its.findIndex((_, i) => cut[i] && order[i] === t + 1)
  const onion = chopping && cur >= 0 && /🧅/u.test(its[cur].e)
  const X = [34, 74, 114]; const knifeX = cur >= 0 ? X[cur] : 74
  const mood = onion ? 'cry' : a === 'fry' && cook ? 'sweat' : cook && a === 'serve' ? 'proud' : chopping ? 'focus' : 'happy'
  const hand = pourK >= 0 ? 'pour' : shaking ? 'shake' : cook && a === 'mix' ? 'stir' : cook && a === 'serve' ? 'kiss' : 'idle'
  const pan = a === 'fry'; const bowl = a === 'mix' || a === 'chop'; const plate = a === 'serve'
  const liquid = pourK >= 0 ? pours[pourK][2] : null
  const soup = pours.find(([, e]) => e === '🍵' || e === '🥛')?.[2] ?? (pours.some(([, e]) => e === '💧') ? '#e39a4e' : '#e8823c')
  const mins = text.match(/(\d+)\s*(?:min|mn|دقيق)/i)?.[1]
  return (
    <div className="relative mx-auto w-full max-w-[360px]" aria-hidden>
      <svg viewBox="0 0 320 240" className="scene-svg block w-full">
        <defs><linearGradient id="wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9a46d" /><stop offset="1" stopColor="#9b6634" /></linearGradient>
          <linearGradient id="steel" x1="0" x2="1"><stop offset="0" stopColor="#5d6770" /><stop offset=".5" stopColor="#9aa6b0" /><stop offset="1" stopColor="#4d565e" /></linearGradient>
          <radialGradient id="fire" cx=".5" cy="1" r="1"><stop offset="0" stopColor="#ffe08a" /><stop offset=".5" stopColor="#ff8a2a" /><stop offset="1" stopColor="#ff5a1f" stopOpacity="0" /></radialGradient></defs>
        <Chef mood={mood} arm={chopping ? 'chop' : 'idle'} hand={hand} />
        {/* counter */}
        <rect x="0" y="182" width="320" height="58" fill="#3a2a20" /><rect x="0" y="178" width="320" height="10" rx="3" fill="#8a5a33" />
        {/* board */}
        <rect x="10" y="168" width="140" height="14" rx="6" fill="url(#wood)" /><ellipse cx="80" cy="186" rx="70" ry="4" fill="#000" opacity=".25" />
        {/* stove fire */}
        {(cook || pourK >= 0 || shaking) && !plate && !bowl && <g className="flames">{[0, 1, 2, 3].map((k) => <ellipse key={k} className="flame" style={{ animationDelay: `${k * 0.12}s` }} cx={236 + k * 14} cy="176" rx="7" ry="12" fill="url(#fire)" />)}</g>}
        {/* vessel */}
        <g className={cook ? (pan ? 'v-shake' : plate ? '' : 'v-simmer') : fly ? 'v-catch' : ''}>
          {pan ? <><ellipse cx="258" cy="164" rx="42" ry="12" fill="#2b2f33" /><ellipse cx="258" cy="161" rx="36" ry="9" fill={fly ? '#c98d3a' : '#3a4046'} /><rect x="296" y="158" width="26" height="7" rx="3.5" fill="#2b2f33" /></>
            : bowl ? <><path d="M216 150 h84 c0 24 -18 32 -42 32 s-42 -8 -42 -32z" fill="#5aa9e6" /><ellipse cx="258" cy="150" rx="42" ry="8" fill={fly ? '#f2d6a2' : '#cfe8fb'} /><path d="M222 156 c8 14 30 18 46 14" stroke="#fff" strokeWidth="3" opacity=".35" fill="none" /></>
            : plate ? <><ellipse cx="258" cy="172" rx="48" ry="10" fill="#e9eef2" /><ellipse cx="258" cy="170" rx="34" ry="6" fill="#fff" />{cook && <path d="M236 168 q22 -18 44 0z" fill="#e8823c" />}</>
            : <><rect x="220" y="128" width="76" height="46" rx="12" fill="url(#steel)" /><ellipse cx="258" cy="128" rx="40" ry="8" fill="#3c444b" /><ellipse cx="258" cy="128" rx="34" ry="5.5" fill={fly || cook ? soup : '#2a3036'} /><rect x="208" y="136" width="14" height="6" rx="3" fill="#4d565e" /><rect x="294" y="136" width="14" height="6" rx="3" fill="#4d565e" />
              {cook && (a === 'boil' || a === 'add' || a === 'rest' || a === 'prep' || a === 'oven') && <g className="lid"><ellipse cx="258" cy="122" rx="38" ry="7" fill="#7c8891" /><rect x="252" y="110" width="12" height="7" rx="3" fill="#3c444b" /></g>}</>}
        </g>
        {/* ingredients */}
        {its.map((x, i) => { const s = shapeOf(x.e); const chopped = cut[i] && t >= order[i]; const dx = 258 - X[i]
          return <g key={i} className={fly ? 'to-pot' : 'drop-board'} style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${(plate ? 0 : pan ? -8 : -40)}px`, animationDelay: fly ? `${i * 110}ms` : `${i * 120}ms` }}>
            {chopped ? <Slices s={s} x={X[i]} y={164} /> : <Food s={s} x={X[i]} y={156} />}</g> })}
        {/* knife chop sound */}
        {chopping && <text key={'tk' + t} x={knifeX - 6} y={140} className="onoma" fontSize="13" fontWeight="800" fill="#fff">tac!</text>}
        {onion && <text key={'sn' + t} x={186} y={70} className="onoma" fontSize="14" fontWeight="800" fill="#9ad8ff">snif…</text>}
        {/* pouring stream */}
        {liquid && <path key={'p' + pourK} className="stream" d="M232 112 C238 118 244 122 250 128" stroke={liquid} strokeWidth="6" strokeLinecap="round" fill="none" />}
        {shaking && Array.from({ length: 12 }, (_, k) => <circle key={k} className="grain-fall" style={{ animationDelay: `${(k * 0.08).toFixed(2)}s` }} cx={212 + (k % 6) * 4} cy={150} r="1.8" fill={DOT[k % DOT.length]} />)}
        {/* cooking life */}
        {cook && pan && [0, 1, 2, 3, 4].map((k) => <circle key={k} className="pop-oil" style={{ animationDelay: `${k * 0.18}s`, ['--dx' as string]: `${(k - 2) * 10}px` }} cx={258} cy={156} r="2" fill="#ffd27a" />)}
        {cook && !pan && !plate && !bowl && [0, 1, 2].map((k) => <path key={k} className="steam-s" style={{ animationDelay: `${k * 0.6}s` }} d={`M${246 + k * 12} 112 q-6 -10 0 -20 q6 -10 0 -20`} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />)}
        {cook && plate && [0, 1, 2].map((k) => <path key={k} className="spark-star" style={{ animationDelay: `${k * 0.4}s` }} transform={`translate(${226 + k * 30} ${140 - (k % 2) * 14})`} d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z" fill="#ffd27a" />)}
      </svg>
      {mins && <span className="absolute end-0 top-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-display text-sm font-extrabold text-ink shadow-lift">⏱ {mins} min</span>}
    </div>)
}
