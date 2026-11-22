import type { CSSProperties } from 'react'
import { E3 } from './E3'

/** Living 3D emoji icons, drop-in for the lucide icons we used for places and things (same props). */
type P = { size?: number | string; strokeWidth?: number | string; className?: string; style?: CSSProperties; 'aria-hidden'?: boolean | 'true' | 'false' }
export type LucideIcon = (p: P) => JSX.Element
const mk = (e: string): LucideIcon => ({ size = 20, strokeWidth, className = '', style }) => (
  <span className={`ico3d inline-grid place-items-center ${className}`} data-on={Number(strokeWidth) > 2 ? '' : undefined} style={{ fontSize: Number(size) * 1.05, ...style }} aria-hidden><E3 e={e} /></span>)
export const Home = mk('🏠'), UtensilsCrossed = mk('🍽️'), Ticket = mk('🎟️'), Wallet = mk('💰'), BookOpen = mk('📖'), CalendarDays = mk('📅'), MapPinned = mk('📍')
export const ShoppingBasket = mk('🧺'), ShoppingCart = mk('🛒'), Store = mk('🏪'), UserRound = mk('🙂'), Dumbbell = mk('🏋️'), Sparkles = mk('✨'), Camera = mk('📷'), History = mk('🗂️')
export const Carrot = mk('🥕'), Flame = mk('🔥'), Clock = mk('⏱️'), Dices = mk('🎲'), Leaf = mk('🌿'), Users = mk('👥'), Zap = mk('⚡'), Coffee = mk('☕'), Moon = mk('🌙'), Sun = mk('☀️'), Sunrise = mk('🌅'), Lightbulb = mk('💡'), Target = mk('🎯'), Lock = mk('🔒'), ShieldCheck = mk('🛡️'), TrendingUp = mk('📈'), AlertTriangle = mk('⚠️')
