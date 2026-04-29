'use client'

import { useEffect, useState } from 'react'
import { Activity } from '@/lib/types'
import { useProduct } from '@/components/ProductProvider'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, differenceInDays, isSameMonth, isToday,
} from 'date-fns'
import Link from 'next/link'

const MARKET_COLORS: Record<string, { bg: string; color: string; bar: string }> = {
  TWN: { bg: 'rgba(245,158,11,0.18)', color: '#92400E', bar: '#F59E0B' },
  HKM: { bg: 'rgba(217,119,6,0.15)',  color: '#92400E', bar: '#D97706' },
  JP:  { bg: 'rgba(248,113,113,0.18)',color: '#991B1B', bar: '#F87171' },
  KR:  { bg: 'rgba(167,139,250,0.18)',color: '#4C1D95', bar: '#A78BFA' },
  TH:  { bg: 'rgba(52,211,153,0.18)', color: '#065F46', bar: '#34D399' },
  VN:  { bg: 'rgba(251,146,60,0.18)', color: '#9A3412', bar: '#FB923C' },
  ID:  { bg: 'rgba(239,68,68,0.18)',  color: '#991B1B', bar: '#EF4444' },
  US:  { bg: 'rgba(96,165,250,0.18)', color: '#1E3A8A', bar: '#60A5FA' },
  EU:  { bg: 'rgba(129,140,248,0.18)',color: '#312E81', bar: '#818CF8' },
}
const FALLBACK_COLOR = { bg: 'rgba(100,116,139,0.15)', color: '#334155', bar: '#94A3B8' }

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

type TrackItem = {
  activity: Activity
  track: number
  colStart: number  // 0-6
  colSpan: number
  isStart: boolean
  isEnd: boolean
  marketCode: string
  marketName: string
}

// Parse ISO date string as local midnight (avoids UTC+offset shift issues)
function toLocalDay(isoStr: string): Date {
  const [y, m, d] = isoStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// endDate is stored as exclusive (start of next day); convert to inclusive last day
function toLastLocalDay(isoStr: string): Date {
  const d = toLocalDay(isoStr)
  d.setDate(d.getDate() - 1)
  return d
}

function getCalendarWeeks(month: Date): Date[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end   = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const weeks: Date[][] = []
  let day = start
  while (day <= end) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1) }
    weeks.push(week)
  }
  return weeks
}

function assignTracks(activities: Activity[], weekStart: Date): TrackItem[] {
  const weekEnd = addDays(weekStart, 6)
  const relevant = activities
    .filter((a) => {
      const s = toLocalDay(a.startDate)
      const raw = toLastLocalDay(a.endDate)
      const e = raw >= s ? raw : s
      return s <= weekEnd && e >= weekStart
    })
    .sort((a, b) => toLocalDay(a.startDate).getTime() - toLocalDay(b.startDate).getTime())

  const trackEnds: Date[] = []
  const result: TrackItem[] = []

  for (const activity of relevant) {
    const startDay = toLocalDay(activity.startDate)
    const rawLastDay = toLastLocalDay(activity.endDate)
    const lastDay = rawLastDay >= startDay ? rawLastDay : startDay
    const actStart = startDay < weekStart ? weekStart : startDay
    const actEnd   = lastDay  > weekEnd   ? weekEnd   : lastDay
    const colStart = differenceInDays(actStart, weekStart)
    const colSpan  = differenceInDays(actEnd, actStart) + 1
    const isStart  = startDay >= weekStart
    const isEnd    = lastDay  <= weekEnd

    let track = trackEnds.findIndex((e) => e < actStart)
    if (track === -1) { track = trackEnds.length }
    trackEnds[track] = actEnd

    const firstMarket = activity.markets[0]
    result.push({
      activity, track, colStart, colSpan, isStart, isEnd,
      marketCode: firstMarket?.market.code ?? '',
      marketName: firstMarket?.market.name ?? '',
    })
  }

  return result
}

export default function CalendarPage() {
  const { product } = useProduct()
  const [activities, setActivities] = useState<Activity[]>([])
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/activities?product=${encodeURIComponent(product)}`).then((r) => r.json()).then((data) => {
      setActivities(data)
      setLoading(false)
    })
  }, [product])

  const weeks = getCalendarWeeks(month)
  const maxTracks = 4 // max visible event rows per week before overflow

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
            活动月历
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            {format(month, 'yyyy 年 M 月')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setMonth(subMonths(month, 1))} style={navBtnStyle}>‹</button>
          <button onClick={() => setMonth(startOfMonth(new Date()))} style={{ ...navBtnStyle, fontSize: '11px', padding: '5px 12px', width: 'auto' }}>今天</button>
          <button onClick={() => setMonth(addMonths(month, 1))} style={navBtnStyle}>›</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)', fontSize: '13px' }}>载入中...</div>
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{
                padding: '10px 0',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-3)',
                letterSpacing: '0.06em',
                background: 'var(--surface-2)',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => {
            const weekStart = week[0]
            const tracks = assignTracks(activities, weekStart)
            const maxTrack = tracks.reduce((m, t) => Math.max(m, t.track), -1)
            const visibleTracks = Math.min(maxTrack + 1, maxTracks)
            const rowHeight = 48 + visibleTracks * 24

            return (
              <div key={wi} style={{ borderBottom: wi < weeks.length - 1 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
                {/* Day cells (date numbers) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: `${rowHeight}px` }}>
                  {week.map((day, di) => {
                    const inMonth = isSameMonth(day, month)
                    const today   = isToday(day)
                    return (
                      <div key={di} style={{
                        borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                        padding: '8px 10px 4px',
                        background: inMonth ? 'transparent' : 'var(--surface-2)',
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          fontSize: '12px',
                          fontWeight: today ? 700 : 400,
                          color: today ? '#0C0C0F' : inMonth ? 'var(--text-1)' : 'var(--text-3)',
                          background: today ? 'var(--accent)' : 'transparent',
                        }}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Activity bars (absolutely positioned) */}
                <div style={{ position: 'absolute', top: '36px', left: 0, right: 0, pointerEvents: 'none' }}>
                  {tracks.filter((t) => t.track < maxTracks).map((t) => {
                    const c = MARKET_COLORS[t.marketCode] ?? FALLBACK_COLOR
                    const cellW = 100 / 7
                    const left  = `calc(${t.colStart * cellW}% + 3px)`
                    const width = `calc(${t.colSpan * cellW}% - 6px)`
                    const top   = `${t.track * 24}px`

                    return (
                      <Link key={t.activity.id + '-' + t.colStart} href={`/activities/${t.activity.id}`} style={{
                        position: 'absolute',
                        left, width, top,
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0 6px',
                        borderRadius: t.isStart && t.isEnd ? '4px' : t.isStart ? '4px 0 0 4px' : t.isEnd ? '0 4px 4px 0' : '0',
                        background: c.bg,
                        borderLeft: `2px solid ${c.bar}`,
                        textDecoration: 'none',
                        overflow: 'hidden',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                      }}>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: c.bar,
                          background: `${c.bar}28`,
                          padding: '0 4px',
                          borderRadius: '3px',
                          flexShrink: 0,
                          lineHeight: '14px',
                        }}>
                          {t.marketName}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 500,
                          color: c.color,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {t.activity.name}
                        </span>
                      </Link>
                    )
                  })}

                  {/* Overflow indicator */}
                  {(() => {
                    const overflowByCol: Record<number, number> = {}
                    tracks.filter((t) => t.track >= maxTracks).forEach((t) => {
                      for (let c = t.colStart; c < t.colStart + t.colSpan; c++) {
                        overflowByCol[c] = (overflowByCol[c] ?? 0) + 1
                      }
                    })
                    return Object.entries(overflowByCol).map(([col, count]) => (
                      <div key={col} style={{
                        position: 'absolute',
                        left: `calc(${parseInt(col) * (100 / 7)}% + 3px)`,
                        width: `calc(${100 / 7}% - 6px)`,
                        top: `${maxTracks * 24}px`,
                        fontSize: '9px',
                        color: 'var(--text-3)',
                        fontWeight: 600,
                        padding: '0 4px',
                      }}>
                        +{count} 更多
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  fontSize: '16px',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  border: '1px solid var(--border-strong)',
  background: 'transparent',
  color: 'var(--text-2)',
  cursor: 'pointer',
}
