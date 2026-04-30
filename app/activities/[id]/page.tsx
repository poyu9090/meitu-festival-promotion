'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Activity } from '@/lib/types'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--text-1)',
  margin: 0,
  letterSpacing: '0.01em',
}

const metaLabel = {
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--text-3)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  marginBottom: '6px',
}

type DailyMetricRow = { date: string; marketCode: string; dau: number | null; newMembers: number | null }
type DailyPoint = { label: string; 本期: number | null; 前一周: number | null }
type MarketMetrics = {
  marketCode: string
  marketName: string
  avgDau: number | null; prevAvgDau: number | null
  avgNewMembers: number | null; prevAvgNewMembers: number | null
  dauPoints: DailyPoint[]
  nmPoints: DailyPoint[]
}

function pctChange(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

function buildDailySeries(
  currRows: DailyMetricRow[], prevRows: DailyMetricRow[],
  code: string, startDate: string, endDate: string, key: 'dau' | 'newMembers'
): DailyPoint[] {
  const points: DailyPoint[] = []
  const d = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  let dayIdx = 0
  while (d <= end) {
    const dateStr = toLocalDateStr(d)
    const prevDate = shiftDays(dateStr, -7)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    const currVal = currRows.find((r) => r.date === dateStr && r.marketCode === code)?.[key] ?? null
    const prevVal = prevRows.find((r) => r.date === prevDate && r.marketCode === code)?.[key] ?? null
    points.push({ label, 本期: currVal, 前一周: prevVal })
    d.setDate(d.getDate() + 1)
    dayIdx++
  }
  return points
}

function summarise(rows: DailyMetricRow[], code: string) {
  const mRows = rows.filter((r) => r.marketCode === code)
  const dauRows = mRows.filter((r) => r.dau != null)
  const nmRows = mRows.filter((r) => r.newMembers != null)
  return {
    avgDau: dauRows.length > 0 ? Math.round(dauRows.reduce((s, r) => s + r.dau!, 0) / dauRows.length) : null,
    avgNewMembers: nmRows.length > 0 ? Math.round(nmRows.reduce((s, r) => s + r.newMembers!, 0) / nmRows.length) : null,
  }
}

async function fetchMetricsForActivity(act: Activity): Promise<MarketMetrics[]> {
  const marketCodes = act.markets.map((m) => m.market.code)
  if (marketCodes.length === 0) return []
  const startDate = act.startDate.slice(0, 10)
  const endDate = act.endDate.slice(0, 10)
  const prevStart = shiftDays(startDate, -7)
  const prevEnd = shiftDays(endDate, -7)
  const mq = marketCodes.join(',')
  const [curr, prev] = await Promise.all([
    fetch(`/api/metrics?start=${startDate}&end=${endDate}&markets=${mq}`).then((r) => r.json()) as Promise<DailyMetricRow[]>,
    fetch(`/api/metrics?start=${prevStart}&end=${prevEnd}&markets=${mq}`).then((r) => r.json()) as Promise<DailyMetricRow[]>,
  ])
  return act.markets.map((m) => {
    const c = summarise(curr, m.market.code)
    const p = summarise(prev, m.market.code)
    return {
      marketCode: m.market.code, marketName: m.market.name,
      ...c, prevAvgDau: p.avgDau, prevAvgNewMembers: p.avgNewMembers,
      dauPoints: buildDailySeries(curr, prev, m.market.code, startDate, endDate, 'dau'),
      nmPoints: buildDailySeries(curr, prev, m.market.code, startDate, endDate, 'newMembers'),
    }
  })
}

function PctBadge({ curr, prev }: { curr: number | null; prev: number | null }) {
  const pct = pctChange(curr, prev)
  if (pct == null) return null
  const positive = pct >= 0
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, marginLeft: '4px',
      color: positive ? '#34D399' : '#F87171',
    }}>
      {positive ? '+' : ''}{pct}%
    </span>
  )
}

function MetricChips({ summaries }: { summaries: MarketMetrics[] }) {
  const hasAny = summaries.some((s) => s.avgDau != null || s.avgNewMembers != null)
  if (!hasAny) return <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>尚无相关数据</span>
  return (
    <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
      {summaries.map((s) => (
        <div key={s.marketCode} style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>{s.marketCode}</div>
          {s.avgDau != null && (
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-2)' }}>
              DAU {s.avgDau.toLocaleString()}<PctBadge curr={s.avgDau} prev={s.prevAvgDau} />
            </div>
          )}
          {s.avgNewMembers != null && (
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent)' }}>
              新增 {s.avgNewMembers.toLocaleString()}<PctBadge curr={s.avgNewMembers} prev={s.prevAvgNewMembers} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [activityMetrics, setActivityMetrics] = useState<MarketMetrics[] | null>(null)
  const [comparisonMetrics, setComparisonMetrics] = useState<Record<number, MarketMetrics[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/activities/${id}`)
      .then((r) => r.json())
      .then(async (act: Activity) => {
        setActivity(act)

        // Fetch all same-product activities for comparison
        const all: Activity[] = await fetch(`/api/activities?product=${encodeURIComponent(act.product as string)}`).then((r) => r.json())

        const marketIds = act.markets.map((m) => m.marketId)
        const startDate = new Date(act.startDate)
        const startYear = startDate.getFullYear()

        const yoy = all.filter(
          (a) => a.id !== act.id &&
            a.markets.some((m) => marketIds.includes(m.marketId)) &&
            new Date(a.startDate).getFullYear() === startYear - 1
        )
        const recent = all
          .filter((a) =>
            a.id !== act.id &&
            a.markets.some((m) => marketIds.includes(m.marketId)) &&
            new Date(a.startDate).getFullYear() === startYear
          )
          .sort((a, b) =>
            Math.abs(new Date(a.startDate).getTime() - startDate.getTime()) -
            Math.abs(new Date(b.startDate).getTime() - startDate.getTime())
          )
          .slice(0, 5)

        setRelatedActivities(yoy)
        setRecentActivities(recent)

        // Fetch DailyMetrics in parallel for current activity + all comparison activities
        const compList = [...recent, ...yoy]
        const [mainMetrics, ...compResults] = await Promise.all([
          fetchMetricsForActivity(act),
          ...compList.map((a) => fetchMetricsForActivity(a)),
        ])

        setActivityMetrics(mainMetrics)
        const map: Record<number, MarketMetrics[]> = {} as Record<number, MarketMetrics[]>
        compList.forEach((a, i) => { map[a.id] = compResults[i] })
        setComparisonMetrics(map)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ color: 'var(--text-3)', fontSize: '13px', paddingTop: '64px', textAlign: 'center' }}>载入中...</div>
  if (!activity) return <div style={{ color: 'var(--danger)', fontSize: '13px', paddingTop: '32px' }}>找不到活动</div>

  const duration = differenceInDays(new Date(activity.endDate), new Date(activity.startDate)) + 1

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Link href="/activities" style={{ fontSize: '11px', color: 'var(--text-3)', textDecoration: 'none' }}>活动列表</Link>
            <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>›</span>
            <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>{activity.name}</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
            {activity.name}
          </h1>
        </div>
        <Link href={`/activities/${id}/edit`} style={{
          fontSize: '11px', fontWeight: 600, color: 'var(--text-2)',
          border: '1px solid var(--border-strong)', borderRadius: '6px',
          padding: '6px 14px', textDecoration: 'none', background: 'var(--surface)',
        }}>
          编辑
        </Link>
      </div>

      {/* Meta info */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '20px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px',
      }}>
        <div>
          <p style={metaLabel}>市场</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {activity.markets.map((m) => (
              <span key={m.marketId} style={{
                fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                background: 'var(--accent-dim)', color: 'var(--accent)',
                padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em',
              }}>
                {m.market.code}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p style={metaLabel}>活动时间</p>
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-1)', margin: 0 }}>
            {format(new Date(activity.startDate), 'yyyy/MM/dd')} –<br />
            {format(new Date(activity.endDate), 'yyyy/MM/dd')}
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{duration} 天</p>
        </div>
        <div>
          <p style={metaLabel}>方案</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{activity.plan}</p>
        </div>
        <div>
          <p style={metaLabel}>价格级别</p>
          <p style={{
            fontSize: '13px', fontWeight: 700,
            color: activity.priceLevel === 'A级' ? 'var(--accent)' : 'var(--text-2)', margin: 0,
          }}>
            {activity.priceLevel}
          </p>
        </div>
        <div>
          <p style={metaLabel}>合辑页配置</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {[
              { label: '一页通', value: activity.pageOnePager },
              { label: '老合辑', value: activity.pageCollectOld },
              { label: '新合辑', value: activity.pageCollectNew },
            ].map(({ label, value }) => (
              <span key={label} style={{
                fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                background: value ? 'var(--accent-dim)' : 'var(--surface-3)',
                color: value ? 'var(--accent)' : 'var(--text-3)',
              }}>
                {value ? '✓' : '✗'} {label}
              </span>
            ))}
          </div>
        </div>
        {(activity.badgeCopyEn || activity.badgeCopyLocal) && (
          <div>
            <p style={metaLabel}>角标文案</p>
            {activity.badgeCopyEn && (
              <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '0 0 2px' }}>
                <span style={{ color: 'var(--text-3)' }}>英文</span> {activity.badgeCopyEn}
              </p>
            )}
            {activity.badgeCopyLocal && (
              <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
                <span style={{ color: 'var(--text-3)' }}>当地语言</span> {activity.badgeCopyLocal}
              </p>
            )}
          </div>
        )}
        {activity.notes && (
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={metaLabel}>备注</p>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>{activity.notes}</p>
          </div>
        )}
      </div>

      {/* Images */}
      {activity.images.length > 0 && (
        <div>
          <h2 style={{ ...sectionTitle, marginBottom: '12px' }}>图片物料</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {activity.images.map((img) => (
              <a key={img.id} href={img.path} target="_blank" rel="noopener noreferrer">
                <div style={{
                  aspectRatio: '16/9', position: 'relative',
                  borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)',
                }}>
                  <Image src={img.path} alt={img.filename} fill style={{ objectFit: 'cover' }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity metrics from DailyMetric */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <h2 style={sectionTitle}>数据成效</h2>
          <span style={{
            fontSize: '10px', fontWeight: 600, color: 'var(--text-3)',
            background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px',
          }}>
            活动期间 · vs 前一周
          </span>
        </div>
        {activityMetrics === null ? (
          <div style={{
            border: '1px dashed var(--border-strong)', borderRadius: '8px',
            padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px',
          }}>载入中...</div>
        ) : activityMetrics.every((s) => s.avgDau == null && s.avgNewMembers == null) ? (
          <div style={{
            border: '1px dashed var(--border-strong)', borderRadius: '8px',
            padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px',
          }}>尚无相关数据</div>
        ) : (() => {
          const fmt = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)
          const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-1)' }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activityMetrics.map((s) => {
                if (s.avgDau == null && s.avgNewMembers == null) return null
                const hasDau = s.dauPoints.some((p) => p['本期'] != null)
                const hasNm  = s.nmPoints.some((p) => p['本期'] != null)
                return (
                  <div key={s.marketCode}>
                    {/* Market header + summary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{s.marketName}</span>
                      {s.avgDau != null && (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                          DAU均 <span style={{ fontFamily: 'monospace', color: 'var(--text-1)', fontWeight: 600 }}>{s.avgDau.toLocaleString()}</span>
                          <PctBadge curr={s.avgDau} prev={s.prevAvgDau} />
                        </span>
                      )}
                      {s.avgNewMembers != null && (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                          新增均 <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{s.avgNewMembers.toLocaleString()}</span>
                          <PctBadge curr={s.avgNewMembers} prev={s.prevAvgNewMembers} />
                        </span>
                      )}
                    </div>
                    {/* Daily charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: hasDau && hasNm ? '1fr 1fr' : '1fr', gap: '12px' }}>
                      {hasDau && (
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DAU · 每日</div>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={s.dauPoints} barGap={2} barCategoryGap="25%">
                              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={38} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="前一周" fill="#E5E7EB" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="本期" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {hasNm && (
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>新增会员含试用 · 每日</div>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={s.nmPoints} barGap={2} barCategoryGap="25%">
                              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={38} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="前一周" fill="#E5E7EB" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="本期" fill="#34D399" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Recent same-market */}
      {recentActivities.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <h2 style={sectionTitle}>近期同市场活动</h2>
            <span style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--text-3)',
              background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px',
            }}>
              今年 · 同市场
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivities.map((a) => (
              <div key={a.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/activities/${a.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', textDecoration: 'none' }}>
                    {a.name}
                  </Link>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-3)', marginTop: '2px' }}>
                    {format(new Date(a.startDate), 'yyyy/MM/dd')} – {format(new Date(a.endDate), 'yyyy/MM/dd')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {[{ label: '一页通', value: a.pageOnePager }, { label: '老合辑', value: a.pageCollectOld }, { label: '新合辑', value: a.pageCollectNew }].map(({ label, value }) => (
                      <span key={label} style={{
                        fontSize: '10px', fontWeight: 500, padding: '1px 6px', borderRadius: '3px',
                        background: value ? 'var(--accent-dim)' : 'var(--surface-3)',
                        color: value ? 'var(--accent)' : 'var(--text-3)',
                      }}>{value ? '✓' : '✗'} {label}</span>
                    ))}
                  </div>
                  {(a.badgeCopyEn || a.badgeCopyLocal) && (
                    <div style={{ marginTop: '6px' }}>
                      {a.badgeCopyEn && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>英文 <span style={{ color: 'var(--text-2)' }}>{a.badgeCopyEn}</span></div>}
                      {a.badgeCopyLocal && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>当地语言 <span style={{ color: 'var(--text-2)' }}>{a.badgeCopyLocal}</span></div>}
                    </div>
                  )}
                </div>
                <MetricChips summaries={comparisonMetrics[a.id] ?? []} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YoY */}
      {relatedActivities.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <h2 style={sectionTitle}>YoY 对比</h2>
            <span style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--text-3)',
              background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px',
            }}>
              去年同期
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {relatedActivities.map((a) => (
              <div key={a.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/activities/${a.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', textDecoration: 'none' }}>
                    {a.name}
                  </Link>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-3)', marginTop: '2px' }}>
                    {format(new Date(a.startDate), 'yyyy/MM/dd')} – {format(new Date(a.endDate), 'yyyy/MM/dd')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {[{ label: '一页通', value: a.pageOnePager }, { label: '老合辑', value: a.pageCollectOld }, { label: '新合辑', value: a.pageCollectNew }].map(({ label, value }) => (
                      <span key={label} style={{
                        fontSize: '10px', fontWeight: 500, padding: '1px 6px', borderRadius: '3px',
                        background: value ? 'var(--accent-dim)' : 'var(--surface-3)',
                        color: value ? 'var(--accent)' : 'var(--text-3)',
                      }}>{value ? '✓' : '✗'} {label}</span>
                    ))}
                  </div>
                  {(a.badgeCopyEn || a.badgeCopyLocal) && (
                    <div style={{ marginTop: '6px' }}>
                      {a.badgeCopyEn && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>英文 <span style={{ color: 'var(--text-2)' }}>{a.badgeCopyEn}</span></div>}
                      {a.badgeCopyLocal && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>当地语言 <span style={{ color: 'var(--text-2)' }}>{a.badgeCopyLocal}</span></div>}
                    </div>
                  )}
                </div>
                <MetricChips summaries={comparisonMetrics[a.id] ?? []} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
