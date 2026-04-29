'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Market } from '@/lib/types'

type Props = { activity?: Activity }

const PLANS = ['包年', '包月', '包周']
const PRICE_LEVELS = ['S级', 'A级', 'B+级', 'B级', '原价']

const inputStyle = {
  width: '100%',
  background: 'var(--surface-2)',
  color: 'var(--text-1)',
  border: '1px solid var(--border-strong)',
  borderRadius: '7px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-3)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  marginBottom: '6px',
}

export default function ActivityForm({ activity }: Props) {
  const router = useRouter()
  const [markets, setMarkets] = useState<Market[]>([])
  const [form, setForm] = useState({
    name: activity?.name ?? '',
    startDate: activity ? activity.startDate.slice(0, 10) : '',
    endDate: activity ? activity.endDate.slice(0, 10) : '',
    plan: activity?.plan ?? '包年',
    priceLevel: activity?.priceLevel ?? 'A级',
    notes: activity?.notes ?? '',
    marketIds: activity?.markets.map((m) => m.marketId) ?? [],
    pageOnePager: activity?.pageOnePager ?? false,
    pageCollectOld: activity?.pageCollectOld ?? false,
    pageCollectNew: activity?.pageCollectNew ?? false,
    badgeCopyEn: activity?.badgeCopyEn ?? '',
    badgeCopyLocal: activity?.badgeCopyLocal ?? '',
  })
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newMarket, setNewMarket] = useState({ name: '', code: '' })
  const [showNewMarket, setShowNewMarket] = useState(false)

  useEffect(() => {
    fetch('/api/markets').then((r) => r.json()).then(setMarkets)
  }, [])

  const toggleMarket = (id: number) => {
    setForm((f) => ({
      ...f,
      marketIds: f.marketIds.includes(id)
        ? f.marketIds.filter((m) => m !== id)
        : [...f.marketIds, id],
    }))
  }


  const addMarket = async () => {
    if (!newMarket.name || !newMarket.code) return
    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMarket),
    })
    const m: Market = await res.json()
    setMarkets((prev) => [...prev, m])
    setForm((f) => ({ ...f, marketIds: [...f.marketIds, m.id] }))
    setNewMarket({ name: '', code: '' })
    setShowNewMarket(false)
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const url = activity ? `/api/activities/${activity.id}` : '/api/activities'
    const res = await fetch(url, {
      method: activity ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const saved: Activity = await res.json()
    if (imageFiles && imageFiles.length > 0) {
      const fd = new FormData()
      fd.append('activityId', String(saved.id))
      for (const f of Array.from(imageFiles)) fd.append('files', f)
      await fetch('/api/upload', { method: 'POST', body: fd })
    }
    router.push(`/activities/${saved.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' }}>

      {/* Activity name */}
      <div>
        <label style={labelStyle}>活动名称 *</label>
        <input
          required
          style={inputStyle}
          value={form.name}
          placeholder="例：万圣节特价活动"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
        />
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>开始日期 *</label>
          <input type="date" required style={inputStyle} value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
          />
        </div>
        <div>
          <label style={labelStyle}>结束日期 *</label>
          <input type="date" required style={inputStyle} value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
          />
        </div>
      </div>

      {/* Plan + Price */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>方案 *</label>
          <select required style={inputStyle} value={form.plan}
            onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
          >
            {PLANS.map((p) => <option key={p} style={{ background: 'var(--surface-2)' }}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>价格级别 *</label>
          <select required style={inputStyle} value={form.priceLevel}
            onChange={(e) => setForm((f) => ({ ...f, priceLevel: e.target.value }))}
          >
            {PRICE_LEVELS.map((p) => <option key={p} style={{ background: 'var(--surface-2)' }}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Markets */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>上线市场 *</label>
          <button type="button" onClick={() => setShowNewMarket(!showNewMarket)} style={{
            fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            ＋ 新增市场
          </button>
        </div>

        {showNewMarket && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input placeholder="市场名称" style={{ ...inputStyle, flex: 1 }} value={newMarket.name}
              onChange={(e) => setNewMarket((n) => ({ ...n, name: e.target.value }))} />
            <input placeholder="代码" style={{ ...inputStyle, width: '80px' }} value={newMarket.code}
              onChange={(e) => setNewMarket((n) => ({ ...n, code: e.target.value.toUpperCase() }))} />
            <button type="button" onClick={addMarket} style={{
              background: 'var(--accent)', color: '#0C0C0F', fontSize: '12px', fontWeight: 600,
              border: 'none', borderRadius: '7px', padding: '0 14px', cursor: 'pointer', flexShrink: 0,
            }}>
              加入
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {markets.map((m) => {
            const selected = form.marketIds.includes(m.id)
            return (
              <button key={m.id} type="button" onClick={() => toggleMarket(m.id)} style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: selected ? 'var(--accent-dim)' : 'transparent',
                color: selected ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {m.name}
              </button>
            )
          })}
          {markets.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>请先新增市场</span>}
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label style={labelStyle}>图片物料</label>
        <div style={{
          border: '1px dashed var(--border-strong)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(e.target.files)}
            style={{ fontSize: '12px', color: 'var(--text-2)', cursor: 'pointer' }} />
          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
            JPG / PNG，每张建议 500KB 以内
          </p>
        </div>
      </div>

      {/* Collection pages */}
      <div>
        <label style={labelStyle}>合辑页配置</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {([
            { key: 'pageOnePager',   label: '一頁式合輯頁' },
            { key: 'pageCollectOld', label: '一般合輯頁（舊版）' },
            { key: 'pageCollectNew', label: '一般合輯頁（新版）' },
          ] as { key: 'pageOnePager' | 'pageCollectOld' | 'pageCollectNew'; label: string }[]).map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Badge copy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>購買頁角標文案（當地語言）*</label>
          <input
            required
            style={inputStyle}
            value={form.badgeCopyEn}
            placeholder="例：限時折扣/限时折扣"
            onChange={(e) => setForm((f) => ({ ...f, badgeCopyEn: e.target.value }))}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
          />
        </div>
        <div>
          <label style={labelStyle}>購買頁角標文案（英文）*</label>
          <input
            required
            style={inputStyle}
            value={form.badgeCopyLocal}
            placeholder="例：限時折扣/限时折扣"
            onChange={(e) => setForm((f) => ({ ...f, badgeCopyLocal: e.target.value }))}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>备注</label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
        <button type="submit" disabled={submitting || form.marketIds.length === 0} style={{
          background: 'var(--accent)',
          color: '#0C0C0F',
          fontSize: '13px',
          fontWeight: 700,
          border: 'none',
          borderRadius: '7px',
          padding: '9px 20px',
          cursor: 'pointer',
          opacity: (submitting || form.marketIds.length === 0) ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}>
          {submitting ? '储存中...' : activity ? '储存变更' : '建立活动'}
        </button>
        <button type="button" onClick={() => router.back()} style={{
          fontSize: '12px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer',
        }}>
          取消
        </button>
      </div>
    </form>
  )
}
