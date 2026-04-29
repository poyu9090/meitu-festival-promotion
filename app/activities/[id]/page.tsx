'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Activity } from '@/lib/types'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import MetricsPanel from '@/components/MetricsPanel'

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

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/activities/${id}`).then((r) => r.json()),
      fetch('/api/activities').then((r) => r.json()),
    ]).then(([act, all]: [Activity, Activity[]]) => {
      setActivity(act)
      if (act?.markets) {
        const marketIds = act.markets.map((m) => m.marketId)
        const startYear = new Date(act.startDate).getFullYear()
        setRelatedActivities(all.filter(
          (a) => a.id !== act.id &&
            a.markets.some((m) => marketIds.includes(m.marketId)) &&
            new Date(a.startDate).getFullYear() === startYear - 1
        ))
      }
      setLoading(false)
    })
  }, [id])

  const refreshActivity = () => {
    fetch(`/api/activities/${id}`).then((r) => r.json()).then(setActivity)
  }

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
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-2)',
          border: '1px solid var(--border-strong)',
          borderRadius: '6px',
          padding: '6px 14px',
          textDecoration: 'none',
          background: 'var(--surface)',
        }}>
          编辑
        </Link>
      </div>

      {/* Meta info */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '20px',
      }}>
        <div>
          <p style={metaLabel}>市场</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {activity.markets.map((m) => (
              <span key={m.marketId} style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 600,
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                padding: '2px 7px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
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
            fontSize: '13px',
            fontWeight: 700,
            color: activity.priceLevel === 'A级' ? 'var(--accent)' : 'var(--text-2)',
            margin: 0,
          }}>
            {activity.priceLevel}
          </p>
        </div>
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
                  aspectRatio: '16/9',
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}>
                  <Image src={img.path} alt={img.filename} fill style={{ objectFit: 'cover' }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      <MetricsPanel activity={activity} onUpdate={refreshActivity} />

      {/* YoY */}
      {relatedActivities.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <h2 style={sectionTitle}>YoY 对比</h2>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-3)',
              background: 'var(--surface-3)',
              padding: '2px 7px',
              borderRadius: '4px',
            }}>
              去年同期
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {relatedActivities.map((a) => (
              <div key={a.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <Link href={`/activities/${a.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', textDecoration: 'none' }}>
                    {a.name}
                  </Link>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-3)', marginTop: '2px' }}>
                    {format(new Date(a.startDate), 'yyyy/MM/dd')} – {format(new Date(a.endDate), 'yyyy/MM/dd')}
                  </div>
                </div>
                {a.metrics.length > 0 ? (
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {a.metrics.map((m) => (
                      <div key={m.id} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{m.market.code}</div>
                        {m.dau != null && <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-2)' }}>DAU {m.dau.toLocaleString()}</div>}
                        {m.revenue != null && <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--accent)' }}>{m.revenue.toLocaleString()}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>尚无数据</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
