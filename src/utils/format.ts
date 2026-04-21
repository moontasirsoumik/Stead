import { useAppStore } from '@/stores/app.store'
import type { Currency, DateFormat } from '@/stores/app.store'

const CURRENCY_MAP: Record<Currency, string> = {
  usd: 'USD', eur: 'EUR', gbp: 'GBP', bdt: 'BDT',
  inr: 'INR', cad: 'CAD', aud: 'AUD', jpy: 'JPY',
}

const LOCALE_MAP: Record<Currency, string> = {
  usd: 'en-US', eur: 'de-DE', gbp: 'en-GB', bdt: 'en-BD',
  inr: 'en-IN', cad: 'en-CA', aud: 'en-AU', jpy: 'ja-JP',
}

export function formatCents(cents: number): string {
  const app = useAppStore()
  const code = CURRENCY_MAP[app.currency] ?? 'USD'
  const locale = LOCALE_MAP[app.currency] ?? 'en-US'
  const dollars = cents / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: app.showCents ? 2 : 0,
    maximumFractionDigits: app.showCents ? 2 : 0,
  }).format(dollars)
}

export function formatDate(iso: string): string {
  const app = useAppStore()
  const date = new Date(iso)
  const fmt = app.dateFormat
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  const fmtMap: Record<DateFormat, string> = {
    mdy: `${m}/${d}/${y}`,
    dmy: `${d}/${m}/${y}`,
    ymd: `${y}-${m}-${d}`,
    iso: `${y}-${m}-${d}`,
  }
  return fmtMap[fmt]
}

export function formatDateLong(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = startOfToday.getTime() - startOfTarget.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays === -1) return 'Tomorrow'
  if (diffDays > 1 && diffDays <= 30) return `${diffDays} days ago`
  if (diffDays < -1 && diffDays >= -30) return `in ${Math.abs(diffDays)} days`

  return formatDateLong(iso)
}
