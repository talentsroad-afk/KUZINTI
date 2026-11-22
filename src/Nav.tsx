import { zf } from './lib/zgh'
import { useEffect, useState } from 'react'
import { Dumbbell, Ticket, UtensilsCrossed, BookOpen, CalendarDays, Home, MapPinned, ShoppingBasket, ShoppingCart, Store, UserRound, Wallet, type LucideIcon } from './icons'
import { useApp } from './lib/store'
import { t, type Lang } from './lib/i18n'
import { LANG_LABEL } from './lib/i18n'
import { Logo, Sheet } from './ui'
import { cname, countryOf } from './lib/countries'
import type { Tab } from './Assist'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)
type Item = [Tab, LucideIcon, string, string]
const items = (lang: Lang): { food: Item[]; life: Item[]; me: Item[] } => ({
  food: [['home', Home, t('tHome', lang), L(lang, 'Today, ideas', 'Aujourd’hui, idées', 'اليوم')], ['week', CalendarDays, t('tWeek', lang), L(lang, 'Your 7 days of meals', 'Vos 7 jours de repas', 'وجبات الأسبوع')], ['recipes', BookOpen, t('tRecipes', lang), L(lang, 'Browse and favourites', 'Parcourir et favoris', 'تصفح')], ['list', ShoppingBasket, t('list', lang), L(lang, 'The list, by aisle', 'La liste, par rayon', 'القائمة')], ['stores', Store, t('tStores', lang), L(lang, 'Compare prices', 'Comparer les prix', 'قارن الأسعار')]],
  life: [['sorties', MapPinned, t('tSorties', lang), L(lang, 'Outings and deals', 'Idées et bons plans', 'نزهات')], ['budget', Wallet, t('tBudget', lang), L(lang, 'Left to live on, savings', 'Reste à vivre, épargne', 'الميزانية')], ['sport', Dumbbell, t('tSport', lang), L(lang, 'Needs, meals, weight', 'Besoins, repas, poids', 'احتياجات ووجبات')]],
  me: [['profile', UserRound, t('profile', lang), L(lang, 'Household, settings', 'Foyer, réglages', 'الأسرة')]],
})
const isOn = (tab: Tab, k: Tab) => tab === k

/** Artistic navigation. Mobile: a floating forest bar with the caddie raised in the middle and "All" for the rest.
 *  Desktop: a zellige sidebar grouped by life area, caddie button always visible. */
export function Nav({ tab, go, left, onCaddie, hasCart, openCountry }: { tab: Tab; go: (k: Tab) => void; left: number; onCaddie: () => void; hasCart: boolean; openCountry: () => void }) {
  const { lang, setLang, me } = useApp()
  const [bump, setBump] = useState(0)
  useEffect(() => { const f = () => setBump((b) => b + 1); addEventListener('kz-cart-bump', f); return () => removeEventListener('kz-cart-bump', f) }, [])
  const [all, setAll] = useState(false)
  const g = items(lang)
  const c = countryOf(me!.country)
  const Bar = ({ k, Icon, label, on, onClick, badge = 0 }: { k: string; Icon: LucideIcon; label: string; on: boolean; onClick: () => void; badge?: number }) => (
    <button key={k} onClick={onClick} aria-current={on ? 'page' : undefined} className={`relative flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 text-[10.5px] font-semibold transition ${on ? 'text-forest' : 'text-cream/75'}`}>
      {on && <span className="arch-on absolute top-[4px] h-[26px] w-11 bg-cream" aria-hidden />}
      <Icon size={21} strokeWidth={on ? 2.4 : 1.8} className="relative" aria-hidden />{badge > 0 && <span key={bump} className="cart-bump absolute end-[22%] top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-apricot px-1 text-[9.5px] font-extrabold text-forest">{badge}</span>}<span className={`relative ${on ? 'font-extrabold text-cream' : ''}`}>{label}</span>
    </button>)
  const Caddie = ({ big }: { big?: boolean }) => (
    <button data-tour="caddie" key={bump} onClick={hasCart ? onCaddie : () => go('list')} aria-label={L(lang, 'Store mode: tick your list in the aisles', 'Mode magasin : cochez votre liste en rayon', 'وضع المتجر')} className={`relative grid place-items-center rounded-full bg-apricot text-forest shadow-lift transition active:scale-90 ${big ? 'h-[62px] w-[62px] -translate-y-4 ring-[5px] ring-[rgb(var(--bg))]' : 'h-12 w-12'}`}>
      <ShoppingCart size={big ? 28 : 22} strokeWidth={2.3} className={bump ? 'cart-bump' : ''} aria-hidden />

    </button>)
  const Tile = ([k, Icon, label, sub]: Item) => (
    <button key={k} onClick={() => { setAll(false); go(k) }} className={`flex items-center gap-3 rounded-[20px] p-3 text-start transition active:scale-[.97] ${isOn(tab, k) ? 'bg-forest text-cream' : 'bg-cream/70'}`}>
      <span className={`arch grid h-11 w-10 shrink-0 place-items-center ${isOn(tab, k) ? 'bg-cream/15' : 'bg-surface text-forest'}`}><Icon size={20} aria-hidden /></span>
      <span className="min-w-0"><b className="block truncate text-[15px]">{label}</b><span className={`block truncate text-[11px] ${isOn(tab, k) ? 'text-cream/75' : 'text-muted'}`}>{sub}</span></span>
    </button>)
  const Side = ([k, Icon, label]: Item) => (
    <button key={k} onClick={() => go(k)} aria-current={isOn(tab, k) ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14.5px] font-semibold transition ${isOn(tab, k) ? 'bg-cream text-forest shadow-soft' : 'text-cream/80 hover:bg-white/10 hover:text-cream'}`}>
      <Icon size={19} strokeWidth={isOn(tab, k) ? 2.4 : 1.8} aria-hidden /> {label}
    </button>)
  const Langs = ({ dark }: { dark?: boolean }) => <div className={`inline-flex rounded-full p-1 ${dark ? 'bg-white/10' : 'bg-cream'}`}>{(['fr', 'en', 'ar', 'zgh'] as Lang[]).map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${lang === l ? (dark ? 'bg-cream text-forest' : 'bg-forest text-white') : dark ? 'text-cream/70' : 'text-muted'}`}>{LANG_LABEL[l]}</button>)}</div>
  return (<>
    {/* Mobile floating bar */}
    <nav data-tour="tabs" className="navbar lg:hidden" aria-label="Main">
      <div className="zellige pointer-events-none absolute inset-0 rounded-[26px] opacity-[.06]" aria-hidden />
      <Bar k="home" Icon={Home} label={t('tHome', lang)} on={tab === 'home' || tab === 'profile'} onClick={() => go('home')} />
      <Bar k="food" badge={hasCart && left > 0 ? left : 0} Icon={UtensilsCrossed} label={L(lang, 'Meals', 'Repas', 'الوجبات')} on={['week', 'recipes', 'list', 'stores', 'sport'].includes(tab)} onClick={() => go(['week', 'recipes', 'list', 'stores', 'sport'].includes(tab) ? tab : 'week')} />
      <Bar k="sorties" Icon={Ticket} label={t('tSorties', lang)} on={tab === 'sorties'} onClick={() => go('sorties')} />
      <Bar k="budget" Icon={Wallet} label={t('tBudget', lang)} on={tab === 'budget'} onClick={() => go('budget')} />
    </nav>
    {tab === 'list' && <div className="fixed bottom-[92px] end-4 z-30 lg:hidden"><Caddie /></div>}
    <Sheet open={all} onClose={() => setAll(false)} title={L(lang, 'Everything in KUZINTI', 'Tout KUZINTI', 'كل كوزينتي')}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-terracotta">{L(lang, 'Kitchen', 'Cuisine', 'المطبخ')}</p>
      <div className="grid grid-cols-2 gap-2">{g.food.map(Tile)}</div>
      <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[.16em] text-terracotta">{L(lang, 'Household life', 'Vie du foyer', 'حياة الأسرة')}</p>
      <div className="grid grid-cols-2 gap-2">{[...g.life, ...g.me].map(Tile)}</div>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-[20px] bg-cream/70 p-3"><button className="flex items-center gap-2 text-sm font-bold" onClick={() => { setAll(false); openCountry() }}><span className="text-2xl">{c.f}</span>{cname(c, lang)} · {c.sym} ›</button><Langs /></div>
    </Sheet>
    {/* Desktop sidebar */}
    <aside className="sidenav hidden lg:flex" aria-label="Main">
      <div className="zellige pointer-events-none absolute inset-0 opacity-[.05]" aria-hidden />
      <button className="relative mb-6 flex items-center gap-2.5 px-2" onClick={() => go('home')}><Logo size={36} /><span className="font-display text-xl font-extrabold tracking-tight text-cream">KUZINTI</span></button>
      <p className="relative mb-1 px-3.5 text-[10.5px] font-bold uppercase tracking-[.18em] text-apricot/90">{L(lang, 'Kitchen', 'Cuisine', 'المطبخ')}</p>
      <div className="relative space-y-0.5">{g.food.map(Side)}</div>
      <p className="relative mb-1 mt-5 px-3.5 text-[10.5px] font-bold uppercase tracking-[.18em] text-apricot/90">{L(lang, 'Household life', 'Vie du foyer', 'حياة الأسرة')}</p>
      <div className="relative space-y-0.5">{[...g.life, ...g.me].map(Side)}</div>
      <div className="relative mt-auto space-y-3">
        <div className="flex items-center justify-between gap-2"><button className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-cream" onClick={openCountry}><span className="text-base">{c.f}</span>{c.sym}</button><Langs dark /></div>
      </div>
    </aside>
  </>)
}
