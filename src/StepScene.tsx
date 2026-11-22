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
const TOOL: Record<Act, string> = { chop: '🔪', mix: '🥣', fry: '🍳', boil: '🍲', oven: '🔥', serve: '🍽️', rest: '⏳', add: '🥘', prep: '🧑‍🍳' }
export const ACT_LABEL: Record<Act, [string, string, string]> = {
  chop: ['Chop', 'Découper', 'قطّع'], mix: ['Mix', 'Mélanger', 'اخلط'], fry: ['Sauté', 'Faire revenir', 'شوّح'], boil: ['Simmer', 'Mijoter', 'اطهُ'],
  oven: ['Bake', 'Au four', 'في الفرن'], serve: ['Serve', 'Servir', 'قدّم'], rest: ['Rest', 'Laisser reposer', 'اترك'], add: ['Add', 'Ajouter', 'أضف'], prep: ['Prepare', 'Préparer', 'حضّر'],
}

/** A small 3D cooking scene that acts out the step: the knife chops, the bowl swirls, the pan sizzles, the pot bubbles… with the step's own ingredients. */
export function StepScene({ text, ings }: { text: string; ings: string[] }) {
  const a = actOf(text); const its = (ings.length ? ings : ['🥕', '🧅', '🍅']).slice(0, 4)
  const mins = text.match(/(\d+)\s*(?:min|mn|دقيق)/i)?.[1]
  return (
    <div className={`scene-act act-${a} relative mx-auto h-[230px] w-full max-w-[320px]`} style={{ perspective: 700 }} aria-hidden>
      <span className="act-shadow absolute bottom-3 left-1/2 h-6 w-48 -translate-x-1/2 rounded-[50%] bg-black/45 blur-md" />
      {(a === 'boil' || a === 'fry' || a === 'oven' || a === 'add') && <span className="act-heat absolute bottom-6 left-1/2 h-10 w-44 -translate-x-1/2 rounded-[50%] blur-xl" />}
      <div className="act-stage absolute inset-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(16deg)' }}>
        {a === 'chop' && <>
          <span className="absolute bottom-6 left-1/2 h-14 w-56 -translate-x-1/2 rounded-2xl bg-gradient-to-b from-[#c98d55] to-[#8a5a2f] shadow-[inset_0_2px_0_rgba(255,255,255,.35),0_14px_20px_-8px_rgba(0,0,0,.6)]" style={{ transform: 'translateX(-50%) rotateX(55deg)' }} />
          {its.map((e, k) => <span key={k} className="chop-piece absolute text-[46px]" style={{ left: `${18 + k * 20}%`, bottom: 40, animationDelay: `${k * 0.7}s` }}><E3 e={e} /></span>)}
          <span className="knife absolute text-[86px]" style={{ left: '42%', bottom: 58 }}><E3 e="🔪" /></span>
        </>}
        {(a === 'mix' || a === 'boil' || a === 'fry' || a === 'oven' || a === 'serve' || a === 'add') && <>
          <span className={`vessel absolute bottom-7 left-1/2 text-[112px] ${a === 'fry' ? 'shake' : a === 'serve' ? 'present' : ''}`}><E3 e={TOOL[a]} /></span>
          {its.map((e, k) => <span key={k} className={`absolute left-1/2 top-0 text-[40px] ${a === 'mix' ? 'swirl' : a === 'fry' ? 'hop' : 'drop-in'}`} style={{ animationDelay: `${k * (a === 'mix' ? 0.55 : 0.6)}s`, ['--sx' as string]: `${(k - (its.length - 1) / 2) * 34}px` }}><E3 e={e} /></span>)}
          {a === 'mix' && <span className="spoon absolute bottom-[86px] left-[56%] text-[56px]"><E3 e="🥄" /></span>}
          {(a === 'boil' || a === 'add') && [0, 1, 2, 3, 4].map((k) => <span key={k} className="bubble absolute bottom-[112px] h-3 w-3 rounded-full border-2 border-white/80" style={{ left: `${40 + k * 5}%`, animationDelay: `${k * 0.45}s` }} />)}
          {(a === 'boil' || a === 'oven' || a === 'add') && [0, 1, 2].map((k) => <span key={k} className="steam absolute bottom-[132px] h-16 w-3 rounded-full bg-white/50 blur-[3px]" style={{ left: `${43 + k * 7}%`, animationDelay: `${k * 0.7}s` }} />)}
          {a === 'fry' && [0, 1, 2, 3, 4, 5].map((k) => <span key={k} className="spark absolute bottom-[96px] h-1.5 w-1.5 rounded-full bg-[#ffd27a]" style={{ left: `${36 + k * 5.5}%`, animationDelay: `${k * 0.23}s`, ['--dx' as string]: `${(k - 2.5) * 12}px` }} />)}
          {a === 'serve' && [0, 1, 2].map((k) => <span key={k} className="twinkle absolute text-2xl" style={{ left: `${22 + k * 28}%`, top: `${12 + (k % 2) * 18}%`, animationDelay: `${k * 0.4}s` }}>✨</span>)}
        </>}
        {(a === 'rest' || a === 'prep') && <>
          <span className="vessel bob absolute bottom-8 left-1/2 text-[100px]"><E3 e={TOOL[a]} /></span>
          {its.map((e, k) => <span key={k} className="orbit-s absolute left-1/2 top-1/2 text-[38px]" style={{ animationDelay: `${-k * (6 / its.length)}s` }}><E3 e={e} /></span>)}
        </>}
      </div>
      {mins && <span className="qty-pop absolute end-1 top-1 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-display text-sm font-extrabold text-ink shadow-lift"><E3 e="⏱️" /> {mins} min</span>}
    </div>)
}
