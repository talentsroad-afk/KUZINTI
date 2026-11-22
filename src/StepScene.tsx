import { useEffect, useState } from 'react'
import { E3 } from './E3'

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
const DOT = ['#d9472b', '#e0a526', '#7a4a21', '#2f7d32', '#f2f2f2']
const VESSEL: Record<Act, string> = { chop: '🥣', mix: '🥣', fry: '🍳', boil: '🍲', add: '🍲', oven: '🥘', serve: '🍽️', rest: '🥘', prep: '🥘' }

/** The step acted out: the real ingredients sit on the board, the knife cuts each one, the pieces jump into the pot or pan, then it cooks (bubbles, steam, sizzle). */
export function StepScene({ text, ings }: { text: string; ings: SceneIng[] }) {
  const a = actOf(text); const solid = ings.filter((x) => !x.l && !x.s); const its = solid.slice(0, 3); const cut = its.map((x) => !!x.c && a !== 'serve')
  const n = cut.filter(Boolean).length
  // what gets poured (oil, water, milk…) and whether spices are sprinkled — from the ingredients and the words of the step
  const pours = LIQ.filter(([rx]) => rx.test(text) || ings.some((x) => x.l && rx.test(x.n ?? ''))).slice(0, 2)
  const spice = SPICE.test(text) || ings.some((x) => x.s)
  const P0 = n + 2; const S0 = P0 + pours.length; const COOK = S0 + (spice ? 1 : 0) // timeline: chops, fly, pours, sprinkle, cook
  const [t, setT] = useState(0)
  useEffect(() => { setT(0); const ids: number[] = []; const C = 720; let at = 350
    for (let k = 1; k <= n; k++) { ids.push(window.setTimeout(() => setT(k), at + C * 0.55)); at += C }
    at += 100; ids.push(window.setTimeout(() => setT(n + 1), at)); at += its.length ? 950 : 200
    for (let k = 0; k < pours.length; k++) { ids.push(window.setTimeout(() => setT(P0 + k), at)); at += 1500 }
    if (spice) { ids.push(window.setTimeout(() => setT(S0), at)); at += 1400 }
    ids.push(window.setTimeout(() => setT(COOK + 1), at))
    return () => ids.forEach(clearTimeout) }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  const pourK = t >= P0 && t < S0 ? t - P0 : -1; const sprinkling = spice && t === S0 && t <= COOK
  const fly = t >= n + 1; const cook = t > COOK
  const order = its.map((_, i) => cut.slice(0, i + 1).filter(Boolean).length) // which chop number each ingredient is
  const knifeOn = n > 0 && t < n; const kx = knifeOn ? 18 + its.findIndex((_, i) => cut[i] && order[i] === t + 1) * 58 : -80
  const VX = 252; const mins = text.match(/(\d+)\s*(?:min|mn|دقيق)/i)?.[1]
  return (
    <div className="relative mx-auto h-[230px] w-[320px] max-w-full" aria-hidden>
      <div className="absolute inset-0" style={{ perspective: 700 }}><div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(14deg)' }}>
        <span className="absolute bottom-4 h-6 w-[300px] rounded-[50%] bg-black/40 blur-md" style={{ left: 10 }} />
        {/* cutting board */}
        {its.length > 0 && <span className="absolute h-[54px] w-[196px] rounded-[18px] bg-gradient-to-b from-[#d6a06a] to-[#94612f] shadow-[inset_0_2px_0_rgba(255,255,255,.35),0_16px_22px_-10px_rgba(0,0,0,.7)]" style={{ left: 4, bottom: 30, transform: 'rotateX(50deg)' }} />}
        {/* the pot / pan / bowl */}
        {cook && (a === 'boil' || a === 'add' || a === 'fry' || a === 'oven') && <span className="act-heat absolute bottom-7 h-10 w-36 rounded-[50%] blur-xl" style={{ left: VX - 72 }} />}
        <span className={`absolute text-[104px] ${cook ? (a === 'fry' ? 'shake' : a === 'serve' ? 'present' : 'pot-on') : fly ? 'pot-catch' : ''}`} style={{ left: VX - 60, bottom: 26, filter: 'drop-shadow(0 18px 14px rgba(0,0,0,.55))' }}><E3 e={VESSEL[a]} /></span>
        {/* ingredients: whole, then chopped pieces, then flying into the pot */}
        {its.map((x, i) => { const x0 = 18 + i * 58; const chopped = cut[i] && t >= order[i]; const fx = VX - x0 - 22; return (
          <span key={i}>
            {!chopped && <span className={`absolute text-[46px] ${fly ? 'fly-pot' : 'land'}`} style={{ left: x0, bottom: 50, animationDelay: fly ? `${i * 120}ms` : `${i * 120}ms`, ['--fx' as string]: `${fx}px`, ['--fy' as string]: '-62px', filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.45))' }}><E3 e={x.e} /></span>}
            {chopped && [0, 1, 2].map((p) => <span key={p} className={`absolute text-[24px] ${fly ? 'fly-pot' : 'piece'}`} style={{ left: x0 + p * 13 - 2, bottom: 48 + (p % 2) * 9, animationDelay: fly ? `${i * 120 + p * 70}ms` : `${p * 40}ms`, ['--fx' as string]: `${fx - p * 13 + 14}px`, ['--fy' as string]: `${-58 - (p % 2) * 9}px`, ['--r' as string]: `${(p - 1) * 35}deg`, filter: 'drop-shadow(0 5px 4px rgba(0,0,0,.4))' }}><E3 e={x.e} /></span>)}
          </span>) })}
        {n > 0 && <span className="absolute text-[78px] transition-[left,opacity] duration-300" style={{ left: kx + 6, bottom: 70, opacity: knifeOn ? 1 : 0, filter: 'drop-shadow(0 14px 10px rgba(0,0,0,.5))' }}><span key={t} className="knife-chop inline-block"><E3 e="🔪" /></span></span>}
        {n > 0 && knifeOn && its.find((x, i) => cut[i] && order[i] === t + 1)?.e === '🧅' && <span key={'cry' + t} className="pop absolute text-[34px]" style={{ left: kx + 70, bottom: 150 }}><E3 e="😭" /></span>}
        {pourK >= 0 && (() => { const [, e, col] = pours[pourK]; return <span key={'p' + pourK}>
          <span className="pour-tilt absolute text-[62px]" style={{ left: VX - 112, bottom: 138, filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.45))' }}><E3 e={e === '💧' ? '🫗' : e === '🫒' ? '🫗' : e} /></span>
          <span className="pour-stream absolute w-[10px] rounded-full" style={{ left: VX - 40, bottom: 92, height: 74, background: `linear-gradient(${col}, ${col}cc)`, boxShadow: `0 0 10px ${col}88` }} />
          {[0, 1, 2, 3].map((k) => <span key={k} className="splash absolute h-2 w-2 rounded-full" style={{ left: VX - 42, bottom: 94, background: col, animationDelay: `${0.45 + k * 0.18}s`, ['--dx' as string]: `${(k - 1.5) * 16}px` }} />)}
          {e === '💧' && <span className="pop absolute text-[22px]" style={{ left: VX - 150, bottom: 175, animationDelay: '.3s' }}>💧</span>}
        </span> })()}
        {sprinkling && <span>
          <span className="shaker absolute text-[54px]" style={{ left: VX - 50, bottom: 150, filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.45))' }}><E3 e="🧂" /></span>
          {Array.from({ length: 14 }, (_, k) => <span key={k} className="sprinkle absolute h-[5px] w-[5px] rounded-full" style={{ left: VX - 30 + (k % 7) * 6, bottom: 150, background: DOT[k % DOT.length], animationDelay: `${(k * 0.09).toFixed(2)}s` }} />)}
        </span>}
        {cook && (a === 'boil' || a === 'add' || a === 'fry') && <span className="comic absolute text-[30px]" style={{ left: VX + 34, bottom: 132 }}><E3 e={a === 'fry' ? '🤩' : '😋'} /></span>}
        {cook && a === 'mix' && <span className="spoon absolute text-[52px]" style={{ left: VX - 4, bottom: 86 }}><E3 e="🥄" /></span>}
        {cook && (a === 'boil' || a === 'add') && [0, 1, 2, 3, 4].map((k) => <span key={k} className="bubble absolute h-3 w-3 rounded-full border-2 border-white/80" style={{ left: VX - 26 + k * 12, bottom: 104, animationDelay: `${k * 0.4}s` }} />)}
        {cook && (a === 'boil' || a === 'add' || a === 'oven' || a === 'rest' || a === 'prep') && [0, 1, 2].map((k) => <span key={k} className="steam absolute h-16 w-3 rounded-full bg-white/50 blur-[3px]" style={{ left: VX - 20 + k * 16, bottom: 124, animationDelay: `${k * 0.7}s` }} />)}
        {cook && a === 'fry' && [0, 1, 2, 3, 4, 5].map((k) => <span key={k} className="spark absolute h-1.5 w-1.5 rounded-full bg-[#ffd27a]" style={{ left: VX - 30 + k * 12, bottom: 96, animationDelay: `${k * 0.2}s`, ['--dx' as string]: `${(k - 2.5) * 12}px` }} />)}
        {cook && a === 'serve' && [0, 1, 2].map((k) => <span key={k} className="twinkle absolute text-2xl" style={{ left: VX - 50 + k * 40, bottom: 130 + (k % 2) * 20, animationDelay: `${k * 0.4}s` }}>✨</span>)}
      </div></div>
      {(mins || a === 'rest') && <span className="qty-pop absolute end-0 top-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-display text-sm font-extrabold text-ink shadow-lift"><E3 e={a === 'rest' ? '⏳' : '⏱️'} /> {mins ? `${mins} min` : ''}</span>}
    </div>)
}

/** What the little chef says at each kind of step (a bit of humour). */
export const CHEF_LINE: Record<Act, [string, string]> = {
  chop: ['Mind your fingers! 🔪', 'Attention aux doigts, chef ! 🔪'], mix: ['Stir it like you mean it 🎶', 'Tourne, tourne, petit bol 🎶'],
  fry: ['Tssss… smells amazing!', 'Tssss… ça sent déjà bon !'], boil: ['Patience, it simmers… 😌', 'Patience, ça mijote… 😌'],
  add: ['Everything in the pot! 🙌', 'Tout dans la marmite ! 🙌'], oven: ['Don’t open the oven every minute 😅', 'On n’ouvre pas le four toutes les 2 min 😅'],
  serve: ['Plate it like a pro 👌', 'Dressage de chef, validé 👌'], rest: ['Coffee break ☕', 'Pause café pour tout le monde ☕'], prep: ['Let’s go, chef! 💪', 'C’est parti, chef ! 💪'],
}
