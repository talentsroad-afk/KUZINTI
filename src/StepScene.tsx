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

export type SceneIng = { e: string; id?: string; c?: boolean; l?: boolean; s?: boolean; n?: string }
const LIQ: [RegExp, string, string][] = [[/huile|oil|زيت/i, '🫒', '#e3b21c'], [/\beau\b|water|ماء/i, '💧', '#79c6ff'], [/lait|milk|حليب/i, '🥛', '#fffaf0'], [/bouillon|stock|broth/i, '🍵', '#c9853a'], [/crème|cream/i, '🥛', '#fff3d6'], [/vinaigre|vinegar/i, '🍷', '#a33'], [/sauce soja|soy/i, '🍶', '#3b2312'], [/citron|lemon|ليمون/i, '🍋', '#f7e35a']]
const SPICE = /épice|epice|sel\b|poivre|cumin|paprika|curcuma|gingembre|cannelle|ras el|herbes|persil|coriandre|spice|salt|pepper|herb|توابل|ملح/i
const DOT = ['#d9472b', '#e0a526', '#7a4a21', '#2f7d32', '#f5f5f5']

/** Each real ingredient drawn by hand (SVG), whole and cut, so you recognise what goes in the pot. */
const KIND: Record<string, string> = { chicken: 'chicken', beef: 'steak', lamb: 'steak', sardine: 'fish', tuna: 'fish', fish: 'fish', egg: 'egg', onion: 'onion', tomato: 'tomato', potato: 'potato', carrot: 'carrot', zucchini: 'zucchini', eggplant: 'eggplant', pumpkin: 'pumpkin', pepper: 'pepper', garlic: 'garlic', lemon: 'lemon', plemon: 'lemon', olives: 'olives', coriander: 'herb', parsley: 'herb', mint: 'herb', bread: 'bread', cheese: 'cheese', rice: 'grain', couscous: 'grain', semolina: 'grain', pasta: 'pasta', vermicelli: 'pasta', lentils: 'beans', chickpeas: 'beans', fava: 'beans', whitebeans: 'beans', almonds: 'beans', apple: 'apple', orange: 'orange', banana: 'banana', dates: 'beans', raisins: 'beans', prunes: 'beans', butter: 'cheese' }
const GRAIN: Record<string, string> = { rice: '#f7f3e8', couscous: '#f0d27a', semolina: '#ecd08a', lentils: '#c8692f', chickpeas: '#e3c48a', fava: '#9bbf5a', whitebeans: '#f2ede0', almonds: '#c08a55', dates: '#7a3e1d', raisins: '#5a2a3a', prunes: '#3d1f2b' }
export const kindOf = (id?: string, e?: string) => (id && KIND[id]) || (e && /🍅/u.test(e) ? 'tomato' : e && /🥕/u.test(e) ? 'carrot' : e && /🧅/u.test(e) ? 'onion' : e && /🐟|🐠/u.test(e) ? 'fish' : e && /🥩|🍖/u.test(e) ? 'steak' : e && /🍗/u.test(e) ? 'chicken' : 'veg')
function Food({ id, k, x, y }: { id?: string; k: string; x: number; y: number }) {
  const T = `translate(${x} ${y})`
  switch (k) {
    case 'tomato': return <g transform={T}><circle r="16" fill="url(#gTom)" /><ellipse cx="-6" cy="-6" rx="5" ry="3.5" fill="#fff" opacity=".45" /><path d="M0 -15 l3 -5 l2 5 l5 -2 l-3 4 l5 2 l-6 1 l-2 4 l-2 -4 l-6 -1 l5 -2 l-3 -4 l5 2z" fill="#3e8e2f" /></g>
    case 'onion': return <g transform={T}><path d="M0 -20 C8 -10 18 -4 17 7 C16 16 8 18 0 18 C-8 18 -16 16 -17 7 C-18 -4 -8 -10 0 -20Z" fill="url(#gOnion)" /><path d="M-7 -8 C-10 2 -9 12 -5 17 M7 -8 C10 2 9 12 5 17 M0 -16 V18" stroke="#8b5a1f" strokeWidth="1.1" fill="none" opacity=".55" /><path d="M0 -20 l-2 -7 M0 -20 l3 -6" stroke="#8a9a3a" strokeWidth="2.4" strokeLinecap="round" /><path d="M-4 18 l-2 4 M0 18 v5 M4 18 l2 4" stroke="#d9c8a0" strokeWidth="1.2" /></g>
    case 'garlic': return <g transform={T}><path d="M0 -16 C10 -8 16 0 14 8 C12 15 6 16 0 16 C-6 16 -12 15 -14 8 C-16 0 -10 -8 0 -16Z" fill="#f6f1e6" stroke="#d8ccb3" /><path d="M-5 -8 C-8 2 -6 12 -3 15 M5 -8 C8 2 6 12 3 15" stroke="#cbb9d6" strokeWidth="1.4" fill="none" /><path d="M0 -16 v-6" stroke="#e6dcc2" strokeWidth="3" strokeLinecap="round" /></g>
    case 'carrot': return <g transform={`${T} rotate(-12)`}><path d="M-26 -6 C-10 -9 12 -6 20 0 C12 6 -10 9 -26 6 Z" fill="url(#gCar)" /><path d="M-18 -4 l4 2 M-8 -5 l3 2 M2 -4 l3 2 M-14 4 l4 -2 M-3 5 l3 -2" stroke="#c45d0e" strokeWidth="1" /><path d="M-26 0 l-10 -9 M-26 0 l-12 -2 M-26 0 l-9 8" stroke="#3e8e2f" strokeWidth="3" strokeLinecap="round" /></g>
    case 'potato': return <g transform={T}><path d="M-18 2 C-19 -10 -4 -14 8 -12 C18 -10 20 0 16 8 C10 15 -14 14 -18 2Z" fill="url(#gPot)" /><circle cx="-8" cy="-3" r="1.3" fill="#7a5426" /><circle cx="5" cy="4" r="1.3" fill="#7a5426" /><circle cx="10" cy="-5" r="1.1" fill="#7a5426" /></g>
    case 'zucchini': return <g transform={`${T} rotate(-8)`}><rect x="-26" y="-7" width="50" height="14" rx="7" fill="#2f6b2a" /><path d="M-22 -3 H20 M-22 2 H20" stroke="#6fa75a" strokeWidth="1.6" opacity=".8" /><rect x="22" y="-3" width="7" height="6" rx="2" fill="#8a9a3a" /></g>
    case 'eggplant': return <g transform={`${T} rotate(-15)`}><path d="M-24 2 C-26 -10 -6 -10 8 -7 C18 -5 20 6 10 9 C-4 13 -22 12 -24 2Z" fill="url(#gEgg)" /><path d="M8 -8 C14 -12 20 -8 22 -4 C18 -2 12 -2 8 -8Z" fill="#4f8a35" /><path d="M20 -6 l7 -3" stroke="#4f8a35" strokeWidth="3" strokeLinecap="round" /><ellipse cx="-10" cy="-3" rx="6" ry="2" fill="#fff" opacity=".25" /></g>
    case 'pepper': return <g transform={T}><path d="M-14 -8 C-18 4 -12 16 -4 15 C0 18 4 18 6 15 C14 16 18 4 14 -8 C8 -13 -8 -13 -14 -8Z" fill="#3fa34d" /><path d="M-2 -12 C-2 -18 4 -20 6 -18" stroke="#2c6b2a" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M-4 -6 V12 M5 -6 V12" stroke="#2f8a3b" strokeWidth="1.2" /><ellipse cx="-8" cy="-2" rx="3" ry="6" fill="#fff" opacity=".3" /></g>
    case 'pumpkin': return <g transform={T}><ellipse rx="19" ry="14" fill="#f08a24" /><path d="M-7 -13 C-11 0 -11 6 -7 13 M7 -13 C11 0 11 6 7 13 M0 -14 V14" stroke="#c8650d" strokeWidth="1.4" fill="none" /><rect x="-2" y="-19" width="4" height="7" rx="1.5" fill="#6b8a35" /></g>
    case 'lemon': return <g transform={T}><path d="M-19 0 C-15 -12 15 -12 19 0 C15 12 -15 12 -19 0Z" fill="#f4d23c" /><circle cx="-19" cy="0" r="2" fill="#e0b81a" /><circle cx="19" cy="0" r="2" fill="#e0b81a" /><ellipse cx="-5" cy="-5" rx="6" ry="2.4" fill="#fff" opacity=".45" /></g>
    case 'olives': return <g transform={T}>{[[-9, 2], [0, -4], [9, 3], [-2, 7]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx="6" ry="4.5" fill={i % 2 ? '#2b2b1f' : '#6c7a2b'} />)}</g>
    case 'herb': return <g transform={T}>{[-10, -3, 4, 11].map((dx, i) => <g key={i}><path d={`M${dx / 2} 16 L${dx} -6`} stroke="#3e7a2e" strokeWidth="1.6" /><ellipse cx={dx} cy={-9 + (i % 2) * 4} rx="6" ry="4.5" fill={i % 2 ? '#4f9a46' : '#5fb04f'} /></g>)}<rect x="-4" y="9" width="8" height="4" rx="1" fill="#c9783a" /></g>
    case 'chicken': return <g transform={`${T} rotate(-20)`}><path d="M-6 -12 C10 -16 20 -4 14 6 C9 14 -4 14 -10 6 C-14 0 -14 -9 -6 -12Z" fill="url(#gChk)" /><rect x="-22" y="3" width="16" height="5" rx="2.5" fill="#f5efe3" transform="rotate(30 -14 5)" /><circle cx="-23" cy="0" r="3.5" fill="#f5efe3" /><circle cx="-21" cy="-4" r="3.2" fill="#f5efe3" /></g>
    case 'steak': return <g transform={T}><path d="M-20 4 C-24 -12 4 -18 18 -8 C26 -2 20 12 4 12 C-8 12 -18 12 -20 4Z" fill="#f3e3d6" /><path d="M-17 3 C-20 -9 3 -14 15 -6 C21 -1 17 9 4 9 C-6 9 -15 9 -17 3Z" fill="url(#gMeat)" /><path d="M-10 -1 C-4 -6 6 -5 10 0 M-6 4 C-2 2 4 2 7 5" stroke="#f3e3d6" strokeWidth="1.6" fill="none" opacity=".8" /></g>
    case 'fish': return <g transform={T}><path d="M-22 0 C-14 -12 10 -12 18 0 C10 12 -14 12 -22 0Z" fill="url(#gFish)" /><path d="M16 0 L28 -9 L26 0 L28 9Z" fill="#6c8ba6" /><path d="M-4 -9 L2 -14 L6 -8Z" fill="#6c8ba6" /><circle cx="-14" cy="-2" r="2.6" fill="#fff" /><circle cx="-14" cy="-2" r="1.4" fill="#1d2a33" /><path d="M-8 -5 C-6 0 -6 3 -8 6" stroke="#6c8ba6" strokeWidth="1.2" fill="none" /></g>
    case 'egg': return <g transform={T}><ellipse rx="12" ry="15" fill="#fbf4e6" stroke="#e8dcc0" /><ellipse cx="-4" cy="-6" rx="3" ry="5" fill="#fff" /></g>
    case 'bread': return <g transform={T}><ellipse rx="22" ry="12" fill="#d79a4e" /><ellipse cx="0" cy="-3" rx="19" ry="8" fill="#e8b46a" /><path d="M-10 -6 l5 6 M-1 -7 l5 6 M8 -6 l5 6" stroke="#b8732f" strokeWidth="2" strokeLinecap="round" /></g>
    case 'cheese': return <g transform={T}><path d="M-18 10 L18 10 L18 -4 L-18 -10Z" fill="#f7cd4e" /><path d="M-18 -10 L18 -4 L10 -12Z" fill="#fbe08a" /><circle cx="-6" cy="2" r="2.6" fill="#e0a92a" /><circle cx="8" cy="5" r="2" fill="#e0a92a" /></g>
    case 'grain': case 'beans': case 'pasta': { const c = GRAIN[id ?? ''] ?? (k === 'pasta' ? '#f3d58b' : '#e9d9a8'); return <g transform={T}><path d="M-20 12 C-18 -2 -8 -10 0 -10 C8 -10 18 -2 20 12Z" fill={c} />{Array.from({ length: 12 }, (_, i) => k === 'pasta' ? <path key={i} d={`M${-14 + (i % 6) * 5} ${2 + Math.floor(i / 6) * 5} q2 -3 4 0`} stroke="#d8b25c" strokeWidth="1.4" fill="none" /> : <ellipse key={i} cx={-13 + (i % 6) * 5.2} cy={1 + Math.floor(i / 6) * 5} rx={k === 'beans' ? 2.6 : 1.8} ry={k === 'beans' ? 2.2 : 1.2} fill="#000" opacity=".13" />)}</g> }
    case 'apple': return <g transform={T}><circle r="15" fill="#d83a35" /><path d="M0 -14 v-6" stroke="#6b4428" strokeWidth="2.4" /><path d="M1 -18 c6 -4 10 -2 10 2 c-5 1 -8 0 -10 -2z" fill="#4f9a46" /><ellipse cx="-5" cy="-5" rx="4" ry="3" fill="#fff" opacity=".4" /></g>
    case 'orange': return <g transform={T}><circle r="15" fill="#f59a22" /><circle cx="-5" cy="-5" r="4" fill="#fff" opacity=".35" /><circle cx="0" cy="-14" r="2" fill="#6b8a35" /></g>
    case 'banana': return <g transform={T}><path d="M-22 -6 C-12 10 12 10 22 -6 C14 4 -14 4 -22 -6Z" fill="#f4d23c" stroke="#c9a313" /></g>
    default: return <g transform={T}><circle r="15" fill="#8fc46a" /><circle cx="-5" cy="-5" r="4" fill="#fff" opacity=".35" /></g>
  }
}
function Slices({ k, x, y }: { k: string; x: number; y: number }) {
  const piece = (i: number) => {
    switch (k) {
      case 'tomato': return <><circle r="7" fill="#e5483b" /><circle r="5" fill="#f37a62" />{[0, 1, 2, 3].map((j) => <circle key={j} cx={Math.cos(j * 1.57) * 2.6} cy={Math.sin(j * 1.57) * 2.6} r=".9" fill="#ffe3a8" />)}</>
      case 'onion': return <>{[7, 5, 3].map((r, j) => <circle key={j} r={r} fill="none" stroke={j % 2 ? '#e9d3ef' : '#c58ac9'} strokeWidth="1.6" />)}</>
      case 'carrot': return <><circle r="6.5" fill="#f28a24" /><circle r="3" fill="#f8b260" /></>
      case 'zucchini': return <><circle r="6.5" fill="#2f6b2a" /><circle r="5.3" fill="#e4f0c8" /><circle r="1.8" fill="#cfe0a0" /></>
      case 'eggplant': return <><circle r="6.5" fill="#4b2b6e" /><circle r="5.4" fill="#f3ead2" /></>
      case 'lemon': return <><circle r="7" fill="#f4d23c" /><circle r="5.6" fill="#fbe98a" />{[0, 1, 2, 3, 4, 5].map((j) => <path key={j} d={`M0 0 L${Math.cos(j) * 5.4} ${Math.sin(j) * 5.4}`} stroke="#f4d23c" strokeWidth=".8" />)}</>
      case 'garlic': return <ellipse rx="4" ry="3" fill="#f6f1e6" stroke="#d8ccb3" />
      case 'herb': return <>{[0, 1, 2].map((j) => <ellipse key={j} cx={(j - 1) * 4} cy={(j % 2) * 3} rx="2.4" ry="1.6" fill="#4f9a46" />)}</>
      case 'fish': return <rect x="-6" y="-5" width="12" height="10" rx="3" fill="#f4d8cf" stroke="#d9b3a6" />
      case 'chicken': return <rect x="-6" y="-5" width="12" height="10" rx="3" fill="#f6c9b0" />
      case 'steak': return <rect x="-6" y="-5" width="12" height="10" rx="2.5" fill="#c64a52" />
      case 'potato': case 'pumpkin': return <rect x="-5.5" y="-5" width="11" height="10" rx="2" fill={k === 'potato' ? '#f3dea0' : '#f6a54a'} />
      case 'pepper': return <rect x="-8" y="-2" width="16" height="4" rx="2" fill="#3fa34d" transform={`rotate(${i * 30})`} />
      default: return <circle r="6" fill="#8fc46a" />
    }
  }
  return <g>{[-14, 0, 14].map((dx, i) => <g key={i} className="slice-pop" style={{ animationDelay: `${i * 50}ms` }}><g transform={`translate(${x + dx} ${y + (i % 2) * 3}) rotate(${(i - 1) * 18})`}>{piece(i)}</g></g>)}</g>
}

/** The chef, drawn in SVG: he chops, cries over onions, pours, stirs, sweats at the pan and blows a kiss at the end. */
function Chef({ mood, arm, hand, taste }: { taste?: boolean; mood: 'happy' | 'cry' | 'sweat' | 'proud' | 'focus' | 'surprise'; arm: 'chop' | 'idle'; hand: 'pour' | 'stir' | 'shake' | 'kiss' | 'idle' }) {
  return (
    <g className={`chef mood-${mood} ${taste ? 'tasting' : ''}`}>
      <g className="chef-sway">
        {/* body */}
        <path d="M118 182 C116 140 128 118 160 116 C192 118 204 140 202 182Z" fill="#fff" stroke="#e5e0d4" strokeWidth="2" />
        <path d="M118 182 C117 150 122 132 134 124 C128 140 128 160 130 182Z" fill="#e9e4d8" /><path d="M186 124 C198 132 203 150 202 182 H190 C192 160 192 140 186 124Z" fill="#e9e4d8" /><rect x="138" y="150" width="44" height="32" rx="4" fill="#2f5d48" /><path d="M138 152 L128 136 M182 152 L192 136" stroke="#2f5d48" strokeWidth="3" /><path d="M144 118 C150 126 170 126 176 118 L172 128 C166 132 154 132 148 128Z" fill="#e5483b" /><path d="M156 128 l4 12 l4 -12Z" fill="#c9302a" />
        <circle cx="150" cy="140" r="2.2" fill="#d8d1c2" /><circle cx="170" cy="140" r="2.2" fill="#d8d1c2" />
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
          <ellipse cx="160" cy="98" rx="4.4" ry="3.8" fill="#e8a37c" /><circle className="hot" cx="160" cy="92" r="26" fill="#ff3b2f" /><g className="ear-steam"><path d="M131 88 q-8 -6 -4 -14 q4 -8 -2 -14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M189 88 q8 -6 4 -14 q-4 -8 2 -14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></g>
          {/* mustache */}
          <path className="stache" d="M160 103 C152 99 142 101 138 108 C146 106 152 108 160 106 C168 108 174 106 182 108 C178 101 168 99 160 103Z" fill="#5a3620" />
          <path className="mouth-happy" d="M153 110 q7 6 14 0" stroke="#7a2e2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse className="mouth-o" cx="160" cy="112" rx="4" ry="5" fill="#7a2e2a" />
          {/* tears & sweat */}
          <g className="tears">{[0, 1, 2].map((k) => <path key={k} className="tear" style={{ animationDelay: `${k * 0.28}s` }} d="M148 94 q-6 10 0 14 q6 -4 0 -14Z" fill="#6fc3ff" stroke="#fff" strokeWidth=".8" />)}{[0, 1, 2].map((k) => <path key={'r' + k} className="tear" style={{ animationDelay: `${k * 0.28 + 0.14}s` }} d="M172 94 q-6 10 0 14 q6 -4 0 -14Z" fill="#6fc3ff" stroke="#fff" strokeWidth=".8" />)}</g>
          <g className="fountain"><path className="jet" d="M146 92 C132 84 120 96 112 116" stroke="#8fd3ff" strokeWidth="4" fill="none" strokeLinecap="round" /><path className="jet" style={{ animationDelay: '.2s' }} d="M174 92 C188 84 200 96 208 116" stroke="#8fd3ff" strokeWidth="4" fill="none" strokeLinecap="round" /></g>
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
export function StepScene({ text, ings, dish = '' }: { text: string; ings: SceneIng[]; dish?: string }) {
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
  const onion = chopping && cur >= 0 && kindOf(its[cur].id, its[cur].e) === 'onion'; const fishy = !fly && its.some((x) => kindOf(x.id, x.e) === 'fish')
  const X = [34, 74, 114]; const knifeX = cur >= 0 ? X[cur] : 74
  const mood = onion ? 'cry' : fishy && !chopping ? 'surprise' : a === 'fry' && cook ? 'sweat' : cook && a === 'serve' ? 'proud' : chopping ? 'focus' : 'happy'
  // The right utensil for the recipe: tajine, couscoussier, oven, pan or pot (a bowl for mixing, a plate to serve).
  const D = dish.toLowerCase()
  const main = /tajine|tagine|طاجين/.test(D) ? 'tajine' : /couscous|seffa|كسكس/.test(D) ? 'couscous' : /gratin|four|rôti|roti|pastilla|pizza|lasagn|parmentier|quiche|gâteau|gateau|cake|tarte|moussaka|al forno|bake|roast|oven|فرن/.test(D) || a === 'oven' ? 'oven' : /poêl|omelette|crêpe|msemen|baghrir|fried|frit|sauté|wok|kefta|burger|steak/.test(D) ? 'pan' : 'pot'
  const V = a === 'serve' ? 'plate' : a === 'mix' || (a === 'chop' && main !== 'tajine') ? 'bowl' : a === 'fry' && main === 'pot' ? 'pan' : main
  const pan = V === 'pan'; const bowl = V === 'bowl'; const plate = V === 'plate'; const tajine = V === 'tajine'; const oven = V === 'oven'; const kesk = V === 'couscous'
  const tasting = cook && (V === 'pot' || tajine || kesk || pan)
  const hand = pourK >= 0 ? 'pour' : shaking ? 'shake' : cook && (a === 'mix' || (bowl && cook)) ? 'stir' : cook && a === 'serve' ? 'kiss' : 'idle'
  const liquid = pourK >= 0 ? pours[pourK][2] : null
  const soup = pours.find(([, e]) => e === '🍵' || e === '🥛')?.[2] ?? (pours.some(([, e]) => e === '💧') ? '#e39a4e' : '#e8823c')
  const mins = text.match(/(\d+)\s*(?:min|mn|دقيق)/i)?.[1]
  return (
    <div className="relative mx-auto w-full max-w-[360px]" aria-hidden>
      <svg viewBox="0 0 320 240" className="scene-svg block w-full">
        <defs><linearGradient id="wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9a46d" /><stop offset="1" stopColor="#9b6634" /></linearGradient>
          <linearGradient id="steel" x1="0" x2="1"><stop offset="0" stopColor="#5d6770" /><stop offset=".5" stopColor="#9aa6b0" /><stop offset="1" stopColor="#4d565e" /></linearGradient>
          <linearGradient id="clay" x1="0" x2="1"><stop offset="0" stopColor="#a4471f" /><stop offset=".45" stopColor="#d9743f" /><stop offset="1" stopColor="#8f3c1a" /></linearGradient>
          <radialGradient id="gTom" cx=".35" cy=".3"><stop offset="0" stopColor="#ff7a5c" /><stop offset="1" stopColor="#c62d22" /></radialGradient>
          <radialGradient id="gOnion" cx=".35" cy=".35"><stop offset="0" stopColor="#f0c27a" /><stop offset="1" stopColor="#b5772c" /></radialGradient>
          <linearGradient id="gCar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ffa94a" /><stop offset="1" stopColor="#e0700f" /></linearGradient>
          <radialGradient id="gPot" cx=".35" cy=".35"><stop offset="0" stopColor="#e0bc84" /><stop offset="1" stopColor="#a8783e" /></radialGradient>
          <radialGradient id="gEgg" cx=".3" cy=".3"><stop offset="0" stopColor="#8a5bbd" /><stop offset="1" stopColor="#3e1f63" /></radialGradient>
          <radialGradient id="gChk" cx=".4" cy=".35"><stop offset="0" stopColor="#f7c48c" /><stop offset="1" stopColor="#c47a3c" /></radialGradient>
          <radialGradient id="gMeat" cx=".4" cy=".4"><stop offset="0" stopColor="#e0656b" /><stop offset="1" stopColor="#a3333b" /></radialGradient>
          <linearGradient id="gFish" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6f90ad" /><stop offset=".55" stopColor="#c6d8e6" /><stop offset="1" stopColor="#eef4f8" /></linearGradient>
          <radialGradient id="fire" cx=".5" cy="1" r="1"><stop offset="0" stopColor="#ffe08a" /><stop offset=".5" stopColor="#ff8a2a" /><stop offset="1" stopColor="#ff5a1f" stopOpacity="0" /></radialGradient></defs>
        <Chef mood={mood} arm={chopping ? 'chop' : 'idle'} hand={hand} taste={tasting && hand === 'idle'} />
        {/* counter */}
        <rect x="0" y="182" width="320" height="58" fill="#3a2a20" /><rect x="0" y="178" width="320" height="10" rx="3" fill="#8a5a33" />
        {/* board */}
        <rect x="10" y="168" width="140" height="14" rx="6" fill="url(#wood)" /><ellipse cx="80" cy="186" rx="70" ry="4" fill="#000" opacity=".25" />
        {/* stove fire */}
        {(cook || pourK >= 0 || shaking) && (V === 'pot' || pan || kesk) && <g className="flames">{[0, 1, 2, 3].map((k) => <ellipse key={k} className="flame" style={{ animationDelay: `${k * 0.12}s` }} cx={236 + k * 14} cy="176" rx="7" ry="12" fill="url(#fire)" />)}</g>}
        {/* vessel */}
        <g className={cook ? (pan ? 'v-shake' : plate || oven ? '' : 'v-simmer') : fly ? 'v-catch' : ''}>
          {pan ? <><ellipse cx="258" cy="164" rx="42" ry="12" fill="#2b2f33" /><ellipse cx="258" cy="161" rx="36" ry="9" fill={fly ? '#c98d3a' : '#3a4046'} /><rect x="296" y="158" width="26" height="7" rx="3.5" fill="#2b2f33" /></>
            : bowl ? <><path d="M216 150 h84 c0 24 -18 32 -42 32 s-42 -8 -42 -32z" fill="#5aa9e6" /><ellipse cx="258" cy="150" rx="42" ry="8" fill={fly ? '#f2d6a2' : '#cfe8fb'} /><path d="M222 156 c8 14 30 18 46 14" stroke="#fff" strokeWidth="3" opacity=".35" fill="none" /></>
            : plate ? <><ellipse cx="258" cy="172" rx="48" ry="10" fill="#e9eef2" /><ellipse cx="258" cy="170" rx="34" ry="6" fill="#fff" />{cook && <path d="M236 168 q22 -18 44 0z" fill="#e8823c" />}</>
            : tajine ? <><path d="M226 178 L232 160 H284 L290 178Z" fill="#8a4b2a" /><path d="M234 172 h48" stroke="#ff8a2a" strokeWidth="3" opacity={cook || fly ? .9 : .3} className={cook ? 'coals' : ''} />
                <ellipse cx="258" cy="158" rx="44" ry="8" fill="#b8562c" /><ellipse cx="258" cy="156" rx="38" ry="5" fill={fly || cook ? soup : '#7a3a1c'} />
                <g className={cook ? 'tj-lid tj-cook' : fly || pourK >= 0 || shaking ? 'tj-lid tj-open' : 'tj-lid'}><path d="M220 156 C234 150 246 116 252 100 L264 100 C270 116 282 150 296 156Z" fill="url(#clay)" /><path d="M228 146 C246 144 270 144 288 146 M240 126 C252 124 264 124 276 126" stroke="#f2d6a2" strokeWidth="2.4" fill="none" /><circle cx="258" cy="96" r="7" fill="#c9683a" /><circle cx="258" cy="96" r="3" fill="#f2d6a2" /></g></>
            : kesk ? <><rect x="222" y="138" width="72" height="38" rx="10" fill="url(#steel)" /><rect x="210" y="146" width="14" height="6" rx="3" fill="#4d565e" /><rect x="292" y="146" width="14" height="6" rx="3" fill="#4d565e" />
                <path d="M226 138 L230 112 H286 L290 138Z" fill="#aab4bc" />{[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={238 + k * 10} cy={126} r="1.8" fill="#4d565e" />)}<ellipse cx="258" cy="112" rx="28" ry="5" fill={fly || cook ? '#f0d27a' : '#7d8890'} /></>
            : oven ? <><rect x="210" y="104" width="100" height="76" rx="8" fill="#2f3439" /><rect x="218" y="122" width="84" height="48" rx="6" fill={cook ? '#ff9a3c' : '#1b1f23'} className={cook ? 'oven-glow' : ''} /><rect x="222" y="126" width="76" height="40" rx="4" fill="#000" opacity=".25" />
                {(fly || cook) && <path d="M232 160 h56 l-4 -8 h-48z" fill="#c9783a" />}{cook && <path d="M236 152 q22 -14 48 0z" fill="#e8a24c" />}<rect x="226" y="112" width="68" height="4" rx="2" fill="#9aa6b0" />{[0, 1, 2].map((k) => <circle key={k} cx={290 - k * 12} cy={110} r="2.8" fill="#9aa6b0" />)}</>
            : <><rect x="220" y="128" width="76" height="46" rx="12" fill="url(#steel)" /><ellipse cx="258" cy="128" rx="40" ry="8" fill="#3c444b" /><ellipse cx="258" cy="128" rx="34" ry="5.5" fill={fly || cook ? soup : '#2a3036'} /><rect x="208" y="136" width="14" height="6" rx="3" fill="#4d565e" /><rect x="294" y="136" width="14" height="6" rx="3" fill="#4d565e" />
              {cook && <g className="lid"><ellipse cx="258" cy="122" rx="38" ry="7" fill="#7c8891" /><rect x="252" y="110" width="12" height="7" rx="3" fill="#3c444b" /></g>}</>}
        </g>
        {cook && oven && [0, 1, 2].map((k) => <path key={k} className="steam-s" style={{ animationDelay: `${k * 0.5}s` }} d={`M${240 + k * 18} 100 q-5 -8 0 -16 q5 -8 0 -16`} stroke="#ffb36b" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".6" />)}
        {cook && (tajine || kesk) && [0, 1, 2].map((k) => <path key={k} className="steam-s" style={{ animationDelay: `${k * 0.55}s` }} d={`M${(tajine ? 252 : 244) + k * (tajine ? 6 : 12)} ${tajine ? 88 : 104} q-6 -10 0 -20 q6 -10 0 -20`} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />)}
        {/* ingredients */}
        {its.map((x, i) => { const k = kindOf(x.id, x.e); const chopped = cut[i] && t >= order[i]; const dx = 258 - X[i]
          return <g key={i} className={fly ? 'to-pot' : 'drop-board'} style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${(plate ? 0 : pan ? -8 : tajine ? -2 : kesk ? -50 : oven ? -14 : -40)}px`, animationDelay: fly ? `${i * 110}ms` : `${i * 120}ms` }}>
            <g className={!chopped && !fly && k === 'fish' ? 'flop' : ''}>{chopped ? <Slices k={k} x={X[i]} y={164} /> : <Food id={x.id} k={k} x={X[i]} y={154} />}</g>
            {!fly && <text x={X[i]} y={198} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#f4f1e8" opacity=".9">{(x.n ?? '').split(/[ (,]/)[0].slice(0, 10)}</text>}</g> })}
        {/* knife chop sound */}
        {chopping && <text key={'tk' + t} x={knifeX - 6} y={140} className="onoma" fontSize="13" fontWeight="800" fill="#fff">tac!</text>}
        {onion && <text key={'sn' + t} x={186} y={70} className="onoma" fontSize="14" fontWeight="800" fill="#9ad8ff">snif…</text>}
        {/* pouring stream */}
        {liquid && <path key={'p' + pourK} className="stream" d="M232 112 C238 118 244 122 250 128" stroke={liquid} strokeWidth="6" strokeLinecap="round" fill="none" />}
        {shaking && Array.from({ length: 12 }, (_, k) => <circle key={k} className="grain-fall" style={{ animationDelay: `${(k * 0.08).toFixed(2)}s` }} cx={212 + (k % 6) * 4} cy={150} r="1.8" fill={DOT[k % DOT.length]} />)}
        {/* cooking life */}
        {cook && pan && [0, 1, 2, 3, 4].map((k) => <circle key={k} className="pop-oil" style={{ animationDelay: `${k * 0.18}s`, ['--dx' as string]: `${(k - 2) * 10}px` }} cx={258} cy={156} r="2" fill="#ffd27a" />)}
        {cook && V === 'pot' && [0, 1, 2].map((k) => <path key={k} className="steam-s" style={{ animationDelay: `${k * 0.6}s` }} d={`M${246 + k * 12} 112 q-6 -10 0 -20 q6 -10 0 -20`} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />)}
        {cook && plate && [0, 1, 2].map((k) => <path key={k} className="spark-star" style={{ animationDelay: `${k * 0.4}s` }} transform={`translate(${226 + k * 30} ${140 - (k % 2) * 14})`} d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z" fill="#ffd27a" />)}
      </svg>
      {mins && <span className="absolute end-0 top-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-display text-sm font-extrabold text-ink shadow-lift">⏱ {mins} min</span>}
    </div>)
}
