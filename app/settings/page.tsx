'use client'

import { useState } from 'react'
import { useProduct } from '@/components/ProductProvider'

function ImportSection({
  title,
  description,
  onImport,
}: {
  title: string
  description: string
  onImport: (file: File) => Promise<{ ok: boolean; message: string }>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string>('')
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult('')
    const { ok, message } = await onImport(file)
    setResult(ok ? `✓ ${message}` : `✗ ${message}`)
    if (ok) setFile(null)
    setImporting(false)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', lineHeight: 1.6 }}>{description}</p>
      </div>

      <div style={{
        border: '1px dashed var(--border-strong)',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
      }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult('') }}
          style={{ fontSize: '12px', color: 'var(--text-2)', cursor: 'pointer' }}
        />
        {file && (
          <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '6px' }}>
            已选择：{file.name}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleImport}
          disabled={!file || importing}
          style={{
            background: 'var(--accent)',
            color: '#0C0C0F',
            fontSize: '12px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            opacity: (!file || importing) ? 0.4 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {importing ? '汇入中...' : '开始汇入'}
        </button>

        {result && (
          <span style={{
            fontSize: '12px',
            color: result.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
            fontWeight: 500,
          }}>
            {result}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { product } = useProduct()

  const importActivities = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/import?product=${encodeURIComponent(product)}`, { method: 'POST', body: fd })
    const data = await res.json()
    return res.ok
      ? { ok: true, message: `成功汇入 ${data.imported} 笔活动` }
      : { ok: false, message: data.error }
  }

  const importDau = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/metrics/import?type=dau', { method: 'POST', body: fd })
    const data = await res.json()
    return res.ok
      ? { ok: true, message: `成功汇入 ${data.imported} 笔 DAU 数据` }
      : { ok: false, message: data.error }
  }

  const importNewMembers = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/metrics/import?type=new_members', { method: 'POST', body: fd })
    const data = await res.json()
    return res.ok
      ? { ok: true, message: `成功汇入 ${data.imported} 笔新增会员数据` }
      : { ok: false, message: data.error }
  }

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '520px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
          设定
        </h1>
      </div>

      <ImportSection
        title="汇入 Excel 历史活动资料"
        description="上传「运营端内推广_活动合辑申请表.xlsx」，自动汇入 2025–2026 年的活动纪录。"
        onImport={importActivities}
      />

      <ImportSection
        title="汇入 DAU 数据"
        description="上传 DAU.xlsx，汇入各市场每日活跃用户数据。活动展开时将显示活动期间的平均 DAU。"
        onImport={importDau}
      />

      <ImportSection
        title="汇入新增会员含试用数据"
        description="上传「新增会员含试用」Excel，汇入各市场每日新增会员数据。活动展开时将显示活动期间的新增会员合计。"
        onImport={importNewMembers}
      />
    </div>
  )
}
