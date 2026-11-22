import { Activity, Award, Bike, Brain, Building2, CalendarDays, Camera, Car, CarTaxiFront, Castle, ChefHat, Church, CircleCheck, Clapperboard, CloudSun, Coffee, Copy, Dices, Droplet, Dumbbell, Film, Flame, Footprints, Gift, Globe, Heart, HeartPulse, History, Hourglass, House, Landmark, Languages, Lightbulb, Lock, Map, MapPin, Medal, MessageCircle, Moon, Mountain, NotebookPen, Package, Palette, PartyPopper, PiggyBank, Pin, Plane, Receipt, Sailboat, Scale, Search, Shield, ShoppingBag, ShoppingBasket, ShoppingCart, Smartphone, Smile, Sparkles, Star, Store, Sun, Sunrise, Target, Tent, Ticket, Timer, Trash2, TreePine, TrendingUp, Trophy, Tv, User, Users, UtensilsCrossed, Wallet, Waves, Zap, type LucideIcon } from 'lucide-react'

/** One modern icon set (Lucide, ISC licence, SF Symbols-like) for every interface glyph that used to be an emoji. Food stays illustrated. */
const MAP: Record<string, [LucideIcon, string]> = {
  '👥': [Users, '#2f7d5b'], '👤': [User, '#2f7d5b'], '🌅': [Sunrise, '#e8892b'], '☀': [Sun, '#e8a21b'], '🌤': [CloudSun, '#e8a21b'], '🌙': [Moon, '#5b6bd6'], '🍵': [Coffee, '#9a6a3a'], '☕': [Coffee, '#9a6a3a'],
  '⏱': [Timer, '#6b7280'], '⏳': [Hourglass, '#6b7280'], '🔥': [Flame, '#f0602a'], '💰': [Wallet, '#2f7d5b'], '👛': [Wallet, '#2f7d5b'], '🐷': [PiggyBank, '#e2668a'], '🛒': [ShoppingCart, '#245B43'], '🧺': [ShoppingBasket, '#245B43'], '🛍': [ShoppingBag, '#245B43'],
  '🗑': [Trash2, '#e5484d'], '✨': [Sparkles, '#e0a526'], '💬': [MessageCircle, '#25a35a'], '📋': [Copy, '#6b7280'], '🏠': [House, '#245B43'], '🏡': [House, '#245B43'], '🎯': [Target, '#e5484d'], '📍': [MapPin, '#e5484d'], '🌍': [Globe, '#2f7fd6'],
  '⚖': [Scale, '#6b7280'], '💡': [Lightbulb, '#e0a526'], '📌': [Pin, '#e5484d'], '🔍': [Search, '#6b7280'], '📸': [Camera, '#6b7280'], '📷': [Camera, '#6b7280'], '🗓': [CalendarDays, '#2f7fd6'], '📅': [CalendarDays, '#2f7fd6'],
  '🏪': [Store, '#245B43'], '🏬': [Building2, '#245B43'], '💪': [Dumbbell, '#7c4dff'], '🏋': [Dumbbell, '#7c4dff'], '🏃': [Footprints, '#7c4dff'], '🚶': [Footprints, '#6b7280'], '🚴': [Bike, '#7c4dff'], '💧': [Droplet, '#2f9be6'], '❤': [Heart, '#e5484d'], '🤍': [Heart, '#e5484d'],
  '✅': [CircleCheck, '#25a35a'], '📈': [TrendingUp, '#25a35a'], '🚗': [Car, '#6b7280'], '🚕': [CarTaxiFront, '#e0a526'], '🎉': [PartyPopper, '#e0a526'], '🎈': [PartyPopper, '#e0a526'], '🧾': [Receipt, '#6b7280'], '📝': [NotebookPen, '#6b7280'], '✍': [NotebookPen, '#6b7280'],
  '📱': [Smartphone, '#6b7280'], '🛡': [Shield, '#2f7d5b'], '🎲': [Dices, '#7c4dff'], '🎟': [Ticket, '#e5484d'], '🗺': [Map, '#2f7fd6'], '🎨': [Palette, '#e2668a'], '⚡': [Zap, '#e0a526'], '🙂': [Smile, '#e0a526'], '🎬': [Clapperboard, '#6b7280'],
  '📺': [Tv, '#6b7280'], '🔒': [Lock, '#6b7280'], '🕘': [History, '#6b7280'], '🗣': [Languages, '#2f7fd6'], '🥫': [Package, '#9a6a3a'], '⭐': [Star, '#e0a526'], '🏆': [Trophy, '#e0a526'], '🥇': [Medal, '#e0a526'], '🏅': [Award, '#e0a526'], '🍽': [UtensilsCrossed, '#245B43'],
  '🧑‍🍳': [ChefHat, '#245B43'], '👨‍🍳': [ChefHat, '#245B43'], '👩‍🍳': [ChefHat, '#245B43'], '⛰': [Mountain, '#2f7d5b'], '🌊': [Waves, '#2f9be6'], '🌳': [TreePine, '#25a35a'], '🌲': [TreePine, '#25a35a'], '🏛': [Landmark, '#9a6a3a'], '🕌': [Landmark, '#2f7d5b'], '⛪': [Church, '#6b7280'],
  '🏰': [Castle, '#9a6a3a'], '🎞': [Film, '#6b7280'], '⛵': [Sailboat, '#2f9be6'], '🏕': [Tent, '#25a35a'], '✈': [Plane, '#2f7fd6'], '🎁': [Gift, '#e2668a'], '🧠': [Brain, '#e2668a'], '🫀': [HeartPulse, '#e5484d'], '📊': [Activity, '#2f7fd6'],
}
const key = (e: string) => e.replace(/️/g, '')
export const hasIc = (e: string) => !!MAP[key(e)]
/** Inline icon sized to the surrounding text, tinted like iOS. */
export function Ic({ e, className = '', tint = true, size = '1.1em' }: { e: string; className?: string; tint?: boolean; size?: string | number }) {
  const m = MAP[key(e)]; if (!m) return <span className={className}>{e}</span>
  const [I, c] = m
  return <I className={`inline-block shrink-0 align-[-0.18em] ${className}`} style={{ width: size, height: size, color: tint ? c : undefined }} strokeWidth={2.2} aria-hidden />
}
