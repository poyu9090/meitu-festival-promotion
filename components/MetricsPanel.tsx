'use client'

import { useState } from 'react'
import { Activity } from '@/lib/types'

type Props = { activity: Activity; onUpdate: () => void }

const inputStyle = {
  width: '100%',
  background: 'var(--surface-3)',
  color: 'var(--text-1)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '13px',
  fontFamily: 'monospace',
  outline: 'none',
}

export default function MetricsPanel({ activity, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [forms, setForms] = useState<Record<number, { dau: string; revenue: string; notes: string }>>(
    Object.fromEntries(
      activity.markets.map((m) => {
        const ex = activity.metrics.find((x) => x.marketId === m.marketId)
        return [m.marketId, { dau: ex?.dau?.toString() ?? '', revenue: ex?.revenue?.toString() ?? '', notes: ex?.notes ?? '' }]
      })
    )
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await Promise.all(
      Object.entries(forms).map(([marketId, data]) =>
        fetch(`/api/activities/${activity.id}/metrics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId: parseInt(marketId),
            dau: data.dau ? parseFloat(data.dau) : null,
            revenue: data.revenue ? parseFloat(data.revenue) : null,
            notes: data.notes || null,
          }),
        })
      )
    )
    setSaving(false)
    setEditing(false)
    onUpdate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '0.01em' }}>
          数据成效
        </h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{
            fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
          }}>
            {activity.metrics.length > 0 ? '编辑数据' : '填入数据 →'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              fontSize: '11px', fontWeight: 700, background: 'var(--accent)', color: '#0C0C0F',
              border: 'none', borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', opacity: saving ? 0.5 : 1,
            }}>
              {saving ? '储存中...' : '储存'}
            </button>
            <button onClick={() => setEditing(false)} style={{
              fontSize: '11px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer',
            }}>取消</button>
          </div>
        )}
      </div>

      {!editing ? (
        activity.metrics.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {activity.metrics.map((m) => (
              <div key={m.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  {m.market.name}
                </p>
                {m.dau != null && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>DAU</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
                      {m.dau.toLocaleString()}
                    </div>
                  </div>
                )}
                {m.revenue != null && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>收入</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>
                      {m.revenue.toLocaleString()}
                    </div>
                  </div>
                )}
                {m.notes && <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>{m.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            border: '1px dashed var(--border-strong)',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: '12px',
          }}>
            尚无相关数据
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activity.markets.map((m) => (
            <div key={m.marketId} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                {m.market.name}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>DAU（平均）</label>
                  <input type="number" style={inputStyle} value={forms[m.marketId]?.dau ?? ''}
                    onChange={(e) => setForms((f) => ({ ...f, [m.marketId]: { ...f[m.marketId], dau: e.target.value } }))}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>收入</label>
                  <input type="number" style={inputStyle} value={forms[m.marketId]?.revenue ?? ''}
                    onChange={(e) => setForms((f) => ({ ...f, [m.marketId]: { ...f[m.marketId], revenue: e.target.value } }))}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>备注</label>
                  <input style={inputStyle} value={forms[m.marketId]?.notes ?? ''}
                    onChange={(e) => setForms((f) => ({ ...f, [m.marketId]: { ...f[m.marketId], notes: e.target.value } }))}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
