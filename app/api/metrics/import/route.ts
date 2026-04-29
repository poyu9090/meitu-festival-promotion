import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Maps Chinese country names used in both Excel files to our market codes
const COUNTRY_TO_CODE: Record<string, string> = {
  '泰国':   'TH',
  '越南':   'VN',
  '中国台湾': 'TWN',
  '日本':   'JP',
  '印度尼西亚': 'ID',
  '韩国':   'KR',
  '中国香港': 'HKM',
  '美国':   'US',
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'dau' | 'new_members'

  if (type !== 'dau' && type !== 'new_members') {
    return NextResponse.json({ error: 'type must be dau or new_members' }, { status: 400 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    type UpsertPayload = { date: string; marketCode: string; dau?: number; newMembers?: number }
    const records: UpsertPayload[] = []

    if (type === 'dau') {
      // Row 2: country names (col 1+); Row 3: sub-headers; Row 4+: date + values
      const countryRow = rows[2] as string[]
      const dataRows = rows.slice(4)

      for (const row of dataRows) {
        const r = row as (string | number)[]
        const dateStr = String(r[0] ?? '').trim()
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue

        for (let col = 1; col < countryRow.length; col++) {
          const country = String(countryRow[col] ?? '').trim()
          const code = COUNTRY_TO_CODE[country]
          if (!code) continue
          const val = Number(r[col])
          if (!isNaN(val) && val > 0) {
            records.push({ date: dateStr, marketCode: code, dau: val })
          }
        }
      }
    } else {
      // new_members: headers in row 0, data from row 1
      // columns: date, os_type, period_type, country_code, 新增会员含试用
      const dataRows = rows.slice(1)

      for (const row of dataRows) {
        const r = row as (string | number)[]
        const dateStr = String(r[0] ?? '').trim()
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue
        const country = String(r[3] ?? '').trim()
        const code = COUNTRY_TO_CODE[country]
        if (!code) continue
        const val = Number(r[4])
        if (!isNaN(val) && val > 0) {
          records.push({ date: dateStr, marketCode: code, newMembers: val })
        }
      }
    }

    // Upsert: update only the relevant field, leave the other intact
    let upserted = 0
    for (const rec of records) {
      if (type === 'dau') {
        await (prisma as any).dailyMetric.upsert({
          where: { date_marketCode: { date: rec.date, marketCode: rec.marketCode } },
          update: { dau: rec.dau },
          create: { date: rec.date, marketCode: rec.marketCode, dau: rec.dau },
        })
      } else {
        await (prisma as any).dailyMetric.upsert({
          where: { date_marketCode: { date: rec.date, marketCode: rec.marketCode } },
          update: { newMembers: rec.newMembers },
          create: { date: rec.date, marketCode: rec.marketCode, newMembers: rec.newMembers },
        })
      }
      upserted++
    }

    return NextResponse.json({ imported: upserted })
  } catch (err) {
    console.error('[metrics import error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
