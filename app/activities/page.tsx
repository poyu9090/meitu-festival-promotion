'use client'

import { useEffect, useState } from 'react'
import { Activity, Market } from '@/lib/types'
import { format, subDays, startOfYear } from 'date-fns'
import Link from 'next/link'
import { useProduct } from '@/components/ProductProvider'

function NotifyToast({ activity, onConfirm, onCancel, sending }: {
  activity: Activity
  onConfirm: () => void
  onCancel: () => void
  sending: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: '12px',
        padding: '24px',
        width: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px' }}>
            寄送通知信件
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
            确认寄出以下活动的折扣通知？
            <br />
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{activity.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={sending} style={{
            fontSize: '12px', color: 'var(--text-2)', background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)', borderRadius: '6px',
            padding: '6px 14px', cursor: 'pointer',
          }}>
            取消
          </button>
          <button onClick={onConfirm} disabled={sending} style={{
            fontSize: '12px', fontWeight: 600,
            color: '#0C0C0F', background: 'var(--accent)',
            border: 'none', borderRadius: '6px',
            padding: '6px 14px', cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1,
          }}>
            {sending ? '寄送中…' : '确认寄出'}
          </button>
        </div>
      </div>
    </div>
  )
}

type TimeRange = '30' | '90' | 'year' | 'all'

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '30', label: '近 30 天' },
  { value: '90', label: '近 90 天' },
  { value: 'year', label: '今年' },
  { value: 'all', label: '全部' },
]

function getTimeRangeCutoff(range: TimeRange): Date | null {
  const now = new Date()
  if (range === '30') return subDays(now, 30)
  if (range === '90') return subDays(now, 90)
  if (range === 'year') return startOfYear(now)
  return null
}

const MARKET_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  TW:  { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: 'rgba(245,158,11,0.35)' },
  TWN: { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: 'rgba(245,158,11,0.35)' },
  HKM: { bg: 'rgba(251,191,36,0.12)',  color: '#D97706', border: 'rgba(217,119,6,0.35)' },
  JP:  { bg: 'rgba(248,113,113,0.15)', color: '#F87171', border: 'rgba(248,113,113,0.35)' },
  KR:  { bg: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: 'rgba(167,139,250,0.35)' },
  SEA: { bg: 'rgba(52,211,153,0.15)',  color: '#34D399', border: 'rgba(52,211,153,0.35)' },
  TH:  { bg: 'rgba(52,211,153,0.15)',  color: '#34D399', border: 'rgba(52,211,153,0.35)' },
  VN:  { bg: 'rgba(251,146,60,0.15)',  color: '#FB923C', border: 'rgba(251,146,60,0.35)' },
  ID:  { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', border: 'rgba(239,68,68,0.35)' },
  US:  { bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA', border: 'rgba(96,165,250,0.35)' },
  EU:  { bg: 'rgba(129,140,248,0.15)', color: '#818CF8', border: 'rgba(129,140,248,0.35)' },
}

function MarketBadge({ code, name }: { code: string; name: string }) {
  const c = MARKET_COLORS[code] ?? { bg: 'var(--accent-dim)', color: 'var(--accent)', border: 'var(--accent)' }
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      padding: '2px 7px',
      borderRadius: '4px',
    }}>
      {name}
    </span>
  )
}

function PriceBadge({ level }: { level: string }) {
  const tier = level.charAt(0).toUpperCase()

  let s: React.CSSProperties
  if (tier === 'S') {
    s = { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)', fontWeight: 700 }
  } else if (tier === 'A') {
    s = { background: 'rgba(129,140,248,0.15)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.35)', fontWeight: 600 }
  } else if (tier === 'B') {
    s = { background: 'rgba(148,163,184,0.12)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.3)', fontWeight: 500 }
  } else {
    s = { background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)', fontWeight: 500 }
  }

  return (
    <span style={{
      display: 'inline-block',
      fontSize: '10px',
      padding: '2px 7px',
      borderRadius: '4px',
      letterSpacing: '0.05em',
      fontFamily: 'monospace',
      ...s,
    }}>
      {level}
    </span>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

type DailyMetricRow = { date: string; marketCode: string; dau: number | null; newMembers: number | null }
type MetricSummary = {
  marketCode: string; marketName: string
  avgDau: number | null; prevAvgDau: number | null
  totalNewMembers: number | null; prevTotalNewMembers: number | null
}

function pctChange(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null
  return Math.round(((curr - prev) / prev) * 1000) / 10 // one decimal
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function summarise(rows: DailyMetricRow[], code: string) {
  const mRows = rows.filter((r) => r.marketCode === code)
  const dauRows = mRows.filter((r) => r.dau != null)
  const nmRows  = mRows.filter((r) => r.newMembers != null)
  return {
    avgDau: dauRows.length > 0 ? Math.round(dauRows.reduce((s, r) => s + r.dau!, 0) / dauRows.length) : null,
    totalNewMembers: nmRows.length > 0 ? nmRows.reduce((s, r) => s + r.newMembers!, 0) : null,
  }
}

function ExpandedDetail({ activity }: { activity: Activity }) {
  const labels: string[] = (() => {
    try { return JSON.parse(activity.labels) } catch { return [] }
  })()

  const [metrics, setMetrics] = useState<MetricSummary[] | null>(null)

  useEffect(() => {
    const marketCodes = activity.markets.map((m) => m.market.code)
    if (marketCodes.length === 0) return

    const startDate = activity.startDate.slice(0, 10)
    const endRaw = new Date(activity.endDate.slice(0, 10) + 'T00:00:00')
    endRaw.setDate(endRaw.getDate() - 1)
    const endDate = endRaw.toISOString().slice(0, 10)

    // Same period one week prior
    const prevStart = shiftDays(startDate, -7)
    const prevEnd   = shiftDays(endDate, -7)

    const mq = marketCodes.join(',')
    Promise.all([
      fetch(`/api/metrics?start=${startDate}&end=${endDate}&markets=${mq}`).then((r) => r.json()),
      fetch(`/api/metrics?start=${prevStart}&end=${prevEnd}&markets=${mq}`).then((r) => r.json()),
    ]).then(([curr, prev]: [DailyMetricRow[], DailyMetricRow[]]) => {
      const summaries: MetricSummary[] = activity.markets.map((m) => {
        const code = m.market.code
        const c = summarise(curr, code)
        const p = summarise(prev, code)
        return {
          marketCode: code,
          marketName: m.market.name,
          avgDau: c.avgDau,
          prevAvgDau: p.avgDau,
          totalNewMembers: c.totalNewMembers,
          prevTotalNewMembers: p.totalNewMembers,
        }
      })
      setMetrics(summaries)
    })
  }, [activity.id])

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          background: 'var(--surface-2)',
          borderTop: '1px solid var(--border)',
          padding: '16px 20px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px 24px',
        }}>

          {/* Plan */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>方案</div>
            <div style={{ fontSize: '12px', color: 'var(--text-1)' }}>{activity.plan || '—'}</div>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>标签</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {labels.map((l, i) => (
                  <span key={i} style={{
                    fontSize: '10px',
                    background: 'var(--surface-3)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                  }}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Collection pages */}
          {(activity.pageOnePager || activity.pageCollectOld || activity.pageCollectNew) && (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>合辑页</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activity.pageOnePager   && <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>✓ 一頁式合輯頁</span>}
                {activity.pageCollectOld && <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>✓ 一般合輯頁（舊版）</span>}
                {activity.pageCollectNew && <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>✓ 一般合輯頁（新版）</span>}
              </div>
            </div>
          )}

          {/* Badge copy */}
          {(activity.badgeCopyEn || activity.badgeCopyLocal) && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>角標文案</div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {activity.badgeCopyEn && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>當地語言</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace' }}>{activity.badgeCopyEn}</div>
                  </div>
                )}
                {activity.badgeCopyLocal && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>英文</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace' }}>{activity.badgeCopyLocal}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DAU + New Members metrics */}
          {metrics !== null && metrics.some((m) => m.avgDau !== null || m.totalNewMembers !== null) && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>活动期间数据</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {metrics.filter((m) => m.avgDau !== null || m.totalNewMembers !== null).map((m) => {
                  const dauDiff = pctChange(m.avgDau, m.prevAvgDau)
                  const nmDiff  = pctChange(m.totalNewMembers, m.prevTotalNewMembers)
                  return (
                    <div key={m.marketCode} style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      minWidth: '150px',
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, marginBottom: '8px' }}>{m.marketName}</div>
                      {m.avgDau !== null && (
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px' }}>DAU（均值）</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{m.avgDau.toLocaleString()}</span>
                            {dauDiff !== null && (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: dauDiff >= 0 ? '#34D399' : '#F87171' }}>
                                {dauDiff >= 0 ? '+' : ''}{dauDiff}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {m.totalNewMembers !== null && (
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px' }}>新增会员含试用（合计）</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{m.totalNewMembers.toLocaleString()}</span>
                            {nmDiff !== null && (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: nmDiff >= 0 ? '#34D399' : '#F87171' }}>
                                {nmDiff >= 0 ? '+' : ''}{nmDiff}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {activity.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>备注</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6 }}>{activity.notes}</div>
            </div>
          )}

          {/* Images */}
          {activity.images.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>素材图片</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activity.images.map((img) => (
                  <a key={img.id} href={img.path} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.path}
                      alt={img.filename}
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <Link href={`/activities/${activity.id}`} style={{
              fontSize: '11px',
              color: 'var(--text-2)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid var(--border-strong)',
            }}>
              查看详情 →
            </Link>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function ActivitiesPage() {
  const { product } = useProduct()
  const [activities, setActivities] = useState<Activity[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [filterMarket, setFilterMarket] = useState<string>('')
  const [filterTime, setFilterTime] = useState<TimeRange>('30')
  const [copying, setCopying] = useState<number | null>(null)
  const [notifyActivity, setNotifyActivity] = useState<Activity | null>(null)
  const [sending, setSending] = useState(false)
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set())
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/activities?product=${encodeURIComponent(product)}`).then((r) => r.json()),
      fetch('/api/markets').then((r) => r.json()),
    ]).then(([acts, mkts]) => {
      setActivities(acts)
      setMarkets(mkts)
      setLoading(false)
    })
  }, [product])

  const cutoff = getTimeRangeCutoff(filterTime)
  const filtered = activities.filter((a) => {
    if (filterMarket && !a.markets.some((m) => m.marketId === parseInt(filterMarket))) return false
    if (cutoff && new Date(a.startDate) < cutoff) return false
    return true
  })

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个活动吗？')) return
    await fetch(`/api/activities/${id}`, { method: 'DELETE' })
    setActivities((prev) => prev.filter((a) => a.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleCopy = async (id: number) => {
    setCopying(id)
    const res = await fetch(`/api/activities/${id}/duplicate`, { method: 'POST' })
    const copy = await res.json()
    setActivities((prev) => [copy, ...prev])
    setCopying(null)
  }

  const handleStatusChange = (id: number, status: string) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    fetch(`/api/activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const handleNotifyConfirm = async () => {
    if (!notifyActivity) return
    setSending(true)
    const res = await fetch(`/api/activities/${notifyActivity.id}/notify`, { method: 'POST' })
    if (res.ok) {
      setNotifiedIds((prev) => new Set(prev).add(notifyActivity.id))
      setSuccessToast(`已成功寄出「${notifyActivity.name}」的通知信件`)
      setTimeout(() => setSuccessToast(null), 4000)
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      alert(`寄信失败：${error}`)
    }
    setSending(false)
    setNotifyActivity(null)
  }

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-3)', fontSize: '13px', paddingTop: '64px', textAlign: 'center' }}>
        载入中...
      </div>
    )
  }

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {notifyActivity && (
        <NotifyToast
          activity={notifyActivity}
          sending={sending}
          onConfirm={handleNotifyConfirm}
          onCancel={() => setNotifyActivity(null)}
        />
      )}

      {/* Success toast */}
      {successToast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'var(--success)',
          color: '#0C0C0F',
          fontSize: '13px',
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <span>✓</span>
          {successToast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
            活动列表
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            共 {filtered.length} 笔活动
          </p>
        </div>
        <Link href="/activities/new" style={{
          fontSize: '12px',
          fontWeight: 600,
          background: 'var(--accent)',
          color: '#0C0C0F',
          padding: '7px 14px',
          borderRadius: '6px',
          textDecoration: 'none',
        }}>
          ＋ 新增活动
        </Link>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Time range pills */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', borderRadius: '7px', padding: '3px' }}>
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterTime(opt.value)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                background: filterTime === opt.value ? 'var(--accent)' : 'transparent',
                color: filterTime === opt.value ? '#0C0C0F' : 'var(--text-2)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-strong)' }} />

        {/* Market select */}
        <select
          value={filterMarket}
          onChange={(e) => setFilterMarket(e.target.value)}
          style={{
            fontSize: '12px',
            background: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: '6px',
            padding: '6px 10px',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">全部市场</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['', '活动名称', '市场', '时间', '价格级别', '状态', '操作'].map((h, i) => (
                <th key={i} style={{
                  padding: '10px 16px',
                  textAlign: i === 6 ? 'right' : 'left',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'var(--surface-2)',
                  width: i === 0 ? '36px' : undefined,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const isExpanded = expandedId === a.id
              const isLast = i === filtered.length - 1
              const now = new Date()
              const isActive = new Date(a.startDate) <= now && now <= new Date(a.endDate)
              const isUpcoming = !isActive && new Date(a.startDate) > now && new Date(a.startDate) <= new Date(now.getTime() + 7 * 86400_000)
              return (
                <>
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: (!isExpanded && isLast) ? 'none' : '1px solid var(--border)',
                      transition: 'background 0.1s',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(52,211,153,0.04)' : 'transparent',
                    }}
                    onClick={() => toggleExpand(a.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? 'rgba(52,211,153,0.04)' : isExpanded ? 'var(--surface-2)' : 'transparent')}
                  >
                    {/* Chevron */}
                    <td style={{ padding: '12px 8px 12px 16px', color: 'var(--text-3)', width: '36px' }}>
                      <ChevronIcon open={isExpanded} />
                    </td>

                    {/* Name */}
                    <td style={{ padding: '12px 16px 12px 8px', fontWeight: 500, color: 'var(--text-1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {a.name}
                        {isActive && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '10px', fontWeight: 600, color: 'var(--success)',
                            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                            padding: '1px 7px', borderRadius: '20px', letterSpacing: '0.03em', flexShrink: 0,
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                            进行中
                          </span>
                        )}
                        {isUpcoming && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '10px', fontWeight: 600, color: '#F59E0B',
                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                            padding: '1px 7px', borderRadius: '20px', letterSpacing: '0.03em', flexShrink: 0,
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                            即将开始
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Markets */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {a.markets.map((m) => (
                          <MarketBadge key={m.marketId} code={m.market.code} name={m.market.name} />
                        ))}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap', lineHeight: 1.7 }}>
                      <div style={{ color: 'var(--text-2)' }}>{format(new Date(a.startDate), 'yyyy/MM/dd')}</div>
                      <div style={{ color: 'var(--text-2)' }}>{format(new Date(a.endDate), 'yyyy/MM/dd')}</div>
                    </td>

                    {/* Price level */}
                    <td style={{ padding: '12px 16px' }}>
                      <PriceBadge level={a.priceLevel} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={a.status}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '20px',
                            border: `1px solid ${a.status === '已配置' ? 'rgba(52,211,153,0.4)' : 'var(--border-strong)'}`,
                            background: a.status === '已配置' ? 'rgba(52,211,153,0.12)' : 'var(--surface-2)',
                            color: a.status === '已配置' ? 'var(--success)' : 'var(--text-3)',
                            cursor: 'pointer',
                            appearance: 'none',
                            paddingRight: '20px',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 5px center',
                          }}
                        >
                          <option value="未配置">未配置</option>
                          <option value="已配置">已配置</option>
                        </select>
                        <button
                          onClick={() => setNotifyActivity(a)}
                          disabled={notifiedIds.has(a.id)}
                          style={{
                            fontSize: '11px',
                            color: notifiedIds.has(a.id) ? 'var(--text-3)' : 'var(--text-2)',
                            background: 'none',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '5px',
                            padding: '2px 8px',
                            cursor: notifiedIds.has(a.id) ? 'default' : 'pointer',
                            opacity: notifiedIds.has(a.id) ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notifiedIds.has(a.id) ? '已寄信' : '寄信'}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td
                      style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/activities/${a.id}/edit`} style={{
                        fontSize: '11px',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        marginRight: '12px',
                      }}>
                        编辑
                      </Link>
                      <button
                        onClick={() => handleCopy(a.id)}
                        disabled={copying === a.id}
                        style={{
                          fontSize: '11px',
                          color: copying === a.id ? 'var(--text-3)' : 'var(--text-2)',
                          background: 'none',
                          border: 'none',
                          cursor: copying === a.id ? 'default' : 'pointer',
                          padding: 0,
                          marginRight: '12px',
                        }}
                      >
                        {copying === a.id ? '复制中…' : '复制'}
                      </button>
                      <button onClick={() => handleDelete(a.id)} style={{
                        fontSize: '11px',
                        color: 'var(--text-3)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}>
                        删除
                      </button>
                    </td>
                  </tr>
                  {isExpanded && <ExpandedDetail key={`${a.id}-detail`} activity={a} />}
                </>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                  没有活动资料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
