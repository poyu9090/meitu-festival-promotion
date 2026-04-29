'use client'

import { useEffect, useState } from 'react'
import { Activity, Market } from '@/lib/types'
import { addDays, differenceInDays, format, startOfYear } from 'date-fns'
import Link from 'next/link'
import { useProduct } from '@/components/ProductProvider'

const MARKET_ORDER = ['US', 'JP', 'KR', 'TWN', 'HKM', 'TH', 'VN', 'ID', 'EU']

type MarketStatus = {
  market: Market
  activeActivity: Activity | null
  lastActivity: Activity | null
  daysSince: number | null
  upcomingActivity: Activity | null
  countThisYear: number
  activeDaysThisYear: number
  tierCounts: { S: number; A: number; B: number }
}

function calcActiveDays(activities: Activity[]): number {
  const ranges = activities.map((a) => [
    new Date(a.startDate).getTime(),
    new Date(a.endDate).getTime(),
  ]).sort((a, b) => a[0] - b[0])
  let totalMs = 0
  let curStart = -1, curEnd = -1
  for (const [s, e] of ranges) {
    if (s > curEnd) {
      if (curEnd !== -1) totalMs += curEnd - curStart
      curStart = s; curEnd = e
    } else {
      curEnd = Math.max(curEnd, e)
    }
  }
  if (curEnd !== -1) totalMs += curEnd - curStart
  return Math.round(totalMs / 86400000)
}

const MARKET_FLAGS: Record<string, string> = {
  TWN: '🇹🇼', HKM: '🇭🇰', JP: '🇯🇵', KR: '🇰🇷',
  TH: '🇹🇭', VN: '🇻🇳', ID: '🇮🇩', US: '🇺🇸', EU: '🇪🇺',
  SG: '🇸🇬', MY: '🇲🇾', PH: '🇵🇭', CA: '🇨🇦', AU: '🇦🇺',
}

function MarketCard({ s, i }: { s: MarketStatus; i: number }) {
  const isActive      = !!s.activeActivity
  const isAlert       = !isActive && s.daysSince !== null && s.daysSince > 30
  const isNoHistory   = !isActive && s.daysSince === null
  const needsAttention = isAlert || isNoHistory

  const flag = MARKET_FLAGS[s.market.code] ?? ''

  const tiers = [
    { label: 'S', count: s.tierCounts?.S ?? 0, color: '#F59E0B' },
    { label: 'A', count: s.tierCounts?.A ?? 0, color: '#818CF8' },
    { label: 'B', count: s.tierCounts?.B ?? 0, color: '#94A3B8' },
  ]

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${i * 35}ms`,
        background: 'var(--surface)',
        border: `1px solid ${isActive ? 'rgba(52,211,153,0.45)' : needsAttention ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isActive ? '0 0 0 3px rgba(52,211,153,0.07), 0 2px 12px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isActive ? 'rgba(52,211,153,0.06)' : 'transparent',
        borderBottom: `1px solid ${isActive ? 'rgba(52,211,153,0.15)' : 'var(--border)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{flag}</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {s.market.name}
          </span>
        </div>
        {isActive && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '10px', fontWeight: 600, color: '#34D399',
            background: 'rgba(52,211,153,0.13)',
            border: '1px solid rgba(52,211,153,0.3)',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399', display: 'inline-block', flexShrink: 0 }} className="pulse-ring" />
            活动进行中
          </span>
        )}
        {needsAttention && !isActive && (
          <span style={{
            fontSize: '10px', fontWeight: 600, color: 'var(--danger)',
            background: 'var(--danger-dim)',
            border: '1px solid rgba(248,113,113,0.25)',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            需关注
          </span>
        )}
      </div>

      {/* ── Active activity ── */}
      {isActive && s.activeActivity && (
        <Link href={`/activities/${s.activeActivity.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(52,211,153,0.04)',
            borderBottom: '1px solid rgba(52,211,153,0.12)',
            display: 'flex', flexDirection: 'column', gap: '3px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#34D399', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>
              进行中
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.35 }}>
              {s.activeActivity.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>
              {format(new Date(s.activeActivity.startDate), 'MM/dd')} – {format(new Date(s.activeActivity.endDate), 'MM/dd')}
              <span style={{ marginLeft: '8px', color: '#34D399', fontWeight: 600 }}>{s.activeActivity.priceLevel}</span>
            </div>
          </div>
        </Link>
      )}

      {/* ── Last activity ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
          上次活动
        </div>
        {s.lastActivity ? (
          <Link href={`/activities/${s.lastActivity.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.35, marginBottom: '5px' }}>
              {s.lastActivity.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>
                {format(new Date(s.lastActivity.startDate), 'MM/dd')} – {format(new Date(s.lastActivity.endDate), 'MM/dd')}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                color: isAlert ? 'var(--danger)' : 'var(--text-3)',
              }}>
                {s.daysSince} 天前
              </span>
            </div>
          </Link>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>尚无活动纪录</span>
        )}
      </div>

      {/* ── Year stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 16px', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '3px' }}>今年活动</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'monospace', lineHeight: 1 }}>{s.countThisYear}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>次</span>
          </div>
        </div>
        <div style={{ padding: '10px 16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '3px' }}>折扣天数</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'monospace', lineHeight: 1 }}>{s.activeDaysThisYear}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>天</span>
          </div>
        </div>
      </div>

      {/* ── SAB tiers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {tiers.map(({ label, count, color }, idx) => (
          <div key={label} style={{
            padding: '8px 0',
            borderRight: idx < 2 ? '1px solid var(--border)' : undefined,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.04em' }}>
              {label} 级
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, color }}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { product } = useProduct()
  const [statuses, setStatuses] = useState<MarketStatus[]>([])
  const [weekActivities, setWeekActivities] = useState<{ activity: Activity; daysUntil: number; status: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/markets').then((r) => r.json()),
      fetch(`/api/activities?product=${encodeURIComponent(product)}`).then((r) => r.json()),
    ]).then(([markets, activities]: [Market[], Activity[]]) => {
      const now = new Date()
      const yearStart = startOfYear(now)

      const result: MarketStatus[] = markets
        .filter((m) => m.code !== 'TW')
        .map((market) => {
          const marketActivities = activities.filter((a) =>
            a.markets.some((m) => m.marketId === market.id)
          )
          const active = marketActivities.filter(
            (a) => new Date(a.startDate) <= now && now <= new Date(a.endDate)
          )
          const past = marketActivities
            .filter((a) => new Date(a.endDate) < now)
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
          const upcoming = marketActivities
            .filter((a) => new Date(a.startDate) > now)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

          const thisYear = marketActivities.filter((a) => new Date(a.startDate) >= yearStart && new Date(a.startDate) <= now)
          const lastActivity = past[0] ?? null
          const daysSince = lastActivity
            ? differenceInDays(now, new Date(lastActivity.endDate))
            : null

          const tierCounts = { S: 0, A: 0, B: 0 }
          for (const a of thisYear) {
            const t = a.priceLevel.charAt(0).toUpperCase()
            if (t === 'S') tierCounts.S++
            else if (t === 'A') tierCounts.A++
            else if (t === 'B') tierCounts.B++
          }

          return {
            market, activeActivity: active[0] ?? null, lastActivity, daysSince,
            upcomingActivity: upcoming[0] ?? null,
            countThisYear: thisYear.length,
            activeDaysThisYear: calcActiveDays(thisYear),
            tierCounts,
          }
        })
        .sort((a, b) => {
          const ai = MARKET_ORDER.indexOf(a.market.code)
          const bi = MARKET_ORDER.indexOf(b.market.code)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })

      // Activities: active now + starting within 14 days (deduplicated, sorted by start date)
      const twoWeekEnd = addDays(now, 14)
      const seen = new Set<number>()
      const upcoming7 = activities
        .filter((a) => {
          const start = new Date(a.startDate)
          const end = new Date(a.endDate)
          const relevant = (start <= now && end >= now) || (start > now && start <= twoWeekEnd)
          return relevant && !seen.has(a.id) && seen.add(a.id)
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .map((a) => {
          const start = new Date(a.startDate)
          const end = new Date(a.endDate)
          const daysAway = differenceInDays(start, now)
          const status = (start <= now && end >= now) ? '进行中'
            : daysAway <= 1 ? '明天'
            : daysAway <= 7 ? '本周'
            : '下周'
          return { activity: a, daysUntil: differenceInDays(start, now), status }
        })

      setWeekActivities(upcoming7)
      setStatuses(result)
      setLoading(false)
    })
  }, [product])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', color: 'var(--text-3)', fontSize: '13px' }}>
        载入中...
      </div>
    )
  }

  const alerts    = statuses.filter((s) => !s.activeActivity && s.daysSince !== null && s.daysSince > 30)
  const noHistory = statuses.filter((s) => !s.activeActivity && s.daysSince === null)

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
          市场活动状态
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
          超过 30 天未办活动的市场将标示警告
        </p>
      </div>

      {/* Alert bar */}
      {(alerts.length > 0 || noHistory.length > 0) && (
        <div style={{
          background: 'var(--danger-dim)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)' }} className="pulse-ring" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>需关注</span>
          </div>
          {alerts.map((s) => (
            <div key={s.market.id} style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-1)', fontWeight: 500, minWidth: '72px' }}>
                {MARKET_FLAGS[s.market.code]} {s.market.name}
              </span>
              <span>距上次活动已 <strong style={{ color: 'var(--danger)', fontFamily: 'monospace' }}>{s.daysSince}</strong> 天</span>
              {s.lastActivity && (
                <span style={{ color: 'var(--text-3)' }}>
                  {s.lastActivity.name}・{format(new Date(s.lastActivity.startDate), 'MM/dd')}–{format(new Date(s.lastActivity.endDate), 'MM/dd')}
                </span>
              )}
            </div>
          ))}
          {noHistory.map((s) => (
            <div key={s.market.id} style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{MARKET_FLAGS[s.market.code]} {s.market.name}</span>
              <span style={{ color: 'var(--text-3)' }}> · 尚无活动纪录</span>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming this week */}
      {weekActivities.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'var(--surface-2)',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.04em' }}>近期活动</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>— 进行中 / 明天 / 本周 / 下周</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {weekActivities.map(({ activity, status }, idx) => {
              const marketNames = activity.markets.map((m) =>
                `${MARKET_FLAGS[m.market.code] ?? ''} ${m.market.name}`
              ).join('  ')
              const tier = activity.priceLevel.charAt(0).toUpperCase()
              const tierStyle =
                tier === 'S' ? { color: '#F59E0B', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' } :
                tier === 'A' ? { color: '#818CF8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)' } :
                tier === 'B' ? { color: '#94A3B8', background: 'rgba(148,163,184,0.1)',  border: '1px solid rgba(148,163,184,0.25)' } :
                               { color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)' }
              return (
                <Link key={activity.id} href={`/activities/${activity.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 16px',
                    borderBottom: idx < weekActivities.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      minWidth: '44px', textAlign: 'center',
                      background: status === '进行中' ? 'rgba(34,197,94,0.1)' : status === '明天' ? 'rgba(239,68,68,0.1)' : status === '本周' ? 'rgba(245,158,11,0.12)' : 'var(--surface-2)',
                      border: `1px solid ${status === '进行中' ? 'rgba(34,197,94,0.3)' : status === '明天' ? 'rgba(239,68,68,0.3)' : status === '本周' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                      borderRadius: '7px', padding: '4px 6px',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: status === '进行中' ? '#22C55E' : status === '明天' ? '#EF4444' : status === '本周' ? 'var(--accent)' : 'var(--text-2)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                        {status}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{marketNames}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>
                          {format(new Date(activity.startDate), 'MM/dd')} – {format(new Date(activity.endDate), 'MM/dd')}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', flexShrink: 0, padding: '2px 7px', borderRadius: '5px', ...tierStyle }}>
                      {activity.priceLevel}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Market grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {statuses.map((s, i) => <MarketCard key={s.market.id} s={s} i={i} />)}
      </div>

      {statuses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>○</div>
          <p style={{ fontSize: '13px' }}>还没有市场资料，请先新增市场与活动</p>
        </div>
      )}
    </div>
  )
}
