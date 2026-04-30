import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Seed markets if not exist
const DEFAULT_MARKETS = [
  { name: '台湾',    code: 'TWN' },
  { name: '港澳',    code: 'HKM' },
  { name: '日本',    code: 'JP'  },
  { name: '韩国',    code: 'KR'  },
  { name: '泰国',    code: 'TH'  },
  { name: '越南',    code: 'VN'  },
  { name: '印尼',    code: 'ID'  },
  { name: '美国',    code: 'US'  },
  { name: '欧洲',    code: 'EU'  },
  { name: '新加坡',  code: 'SG'  },
  { name: '马来西亚', code: 'MY' },
  { name: '菲律宾',  code: 'PH'  },
  { name: '加拿大',  code: 'CA'  },
  { name: '澳洲',    code: 'AU'  },
]

// Keywords to detect each market in a region string.
// codes: one keyword hit → all listed codes are added.
const MARKET_KEYWORDS: { codes: string[]; keywords: string[] }[] = [
  { codes: ['TWN', 'HKM'],         keywords: ['台/港/澳', '台港澳'] },
  { codes: ['TWN', 'SG', 'MY'],    keywords: ['台新馬', '台新马'] },
  { codes: ['TWN'],                keywords: ['台灣', '台湾', '台灣 馬', '台'] },
  { codes: ['HKM'],                keywords: ['港澳', '港/澳'] },
  { codes: ['SG', 'MY'],           keywords: ['新馬', '新马'] },
  { codes: ['MY'],                 keywords: ['马来西亚', '馬來西亞'] },
  { codes: ['SG'],                 keywords: ['新加坡'] },
  { codes: ['JP'],                 keywords: ['日本'] },
  { codes: ['KR'],                 keywords: ['韓國', '韩国'] },
  { codes: ['TH'],                 keywords: ['泰國', '泰国', '泰'] },
  { codes: ['VN'],                 keywords: ['越南', '越/'] },
  { codes: ['ID'],                 keywords: ['印尼'] },
  { codes: ['PH'],                 keywords: ['菲律賓', '菲律宾'] },
  { codes: ['ID', 'PH'],           keywords: ['印菲'] },
  { codes: ['TH', 'VN', 'ID'],     keywords: ['東南亞', '东南亚', 'SEA'] },
  { codes: ['US'],                 keywords: ['美國', '美国'] },
  { codes: ['US', 'CA'],           keywords: ['美/加', '美加'] },
  { codes: ['US', 'AU'],           keywords: ['美澳'] },
  { codes: ['US', 'CA', 'AU'],     keywords: ['美加澳', '美/加/澳', '美澳加'] },
  { codes: ['CA'],                 keywords: ['加拿大'] },
  { codes: ['AU'],                 keywords: ['澳洲', '澳大利亞', '澳大利亚'] },
  { codes: ['AU', 'EU'],           keywords: ['澳英'] },
  { codes: ['EU'],                 keywords: ['歐洲', '欧洲', '英'] },
]

function resolveMarketIds(
  regionRaw: string,
  marketByCode: Record<string, { id: number }>
): number[] {
  const idSet = new Set<number>()
  for (const { codes, keywords } of MARKET_KEYWORDS) {
    if (keywords.some((k) => regionRaw.includes(k))) {
      for (const code of codes) {
        if (marketByCode[code]) idSet.add(marketByCode[code].id)
      }
    }
  }
  return [...idSet]
}

function excelDateToJSDate(serial: number): Date {
  const utcDays = serial - 25569
  const ms = utcDays * 86400 * 1000
  return new Date(ms)
}

export async function POST(req: Request) {
  try {
  const { searchParams } = new URL(req.url)
  const product = searchParams.get('product') || '美图秀秀'

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // Clear only activities of this product before reimport
  const toDelete = await prisma.activity.findMany({ where: { product }, select: { id: true } })
  const ids = toDelete.map((a) => a.id)
  if (ids.length > 0) {
    await prisma.activityMetric.deleteMany({ where: { activityId: { in: ids } } })
    await prisma.activityImage.deleteMany({ where: { activityId: { in: ids } } })
    await prisma.activityOnMarket.deleteMany({ where: { activityId: { in: ids } } })
    await prisma.activity.deleteMany({ where: { id: { in: ids } } })
  }

  // Seed markets
  for (const m of DEFAULT_MARKETS) {
    await prisma.market.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    })
  }
  const allMarkets = await prisma.market.findMany()
  const marketByCode = Object.fromEntries(allMarkets.map((m) => [m.code, m]))

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Find header row (look for '活動名稱' or '活动名称')
  let headerIdx = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] as string[]
    if (row.some((c) => String(c).includes('活動名') || String(c).includes('活动名'))) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) return NextResponse.json({ error: 'Cannot find header row' }, { status: 400 })

  const headers = (rows[headerIdx] as string[]).map((h) => String(h).trim())
  const nameIdx = headers.findIndex((h) => h.includes('活動名') || h.includes('活动名'))
  const startIdx = headers.findIndex((h) => h.includes('時間') || h.includes('时间') || h.includes('上架'))
  const regionIdx = headers.findIndex((h) => h.includes('上線地區') || h.includes('上线地区'))
  const planIdx = headers.findIndex((h) => h.includes('方案'))
  const priceIdx = headers.findIndex((h) => h.includes('價格') || h.includes('价格'))
  const notesIdx = headers.findIndex((h) => h.includes('備註') || h.includes('备注'))

  const toBool = (v: unknown) => v === 1 || String(v).toLowerCase() === 'true'
  const clean  = (v: unknown) => { const s = String(v ?? '').trim(); return s === '-' || s === '' ? null : s }

  // Parse all rows first (sync, no DB calls)
  type ActivityData = {
    name: string; startDate: Date; endDate: Date; plan: string; priceLevel: string
    notes: string | null; pageOnePager: boolean; pageCollectOld: boolean; pageCollectNew: boolean
    badgeCopyEn: string | null; badgeCopyLocal: string | null; marketIds: number[]
  }
  const toImport: ActivityData[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as (string | number)[]
    const name = String(row[nameIdx] ?? '').trim()
    if (!name || name === '範例' || name === '范例') continue

    const rawStart = row[startIdx]
    if (typeof rawStart !== 'number' || rawStart <= 40000) continue
    const startDate = excelDateToJSDate(rawStart)
    if (startDate.getFullYear() < 2025 || startDate.getFullYear() > 2026) continue

    // End date is in the immediately following empty-name row's date column (inclusive last day).
    const nextRow = rows[i + 1] as (string | number)[] | undefined
    const rawEndSerial = typeof nextRow?.[startIdx] === 'number' ? nextRow[startIdx] as number : null
    const endDate = rawEndSerial && rawEndSerial >= rawStart
      ? excelDateToJSDate(rawEndSerial)
      : new Date(startDate.getTime() + 6 * 86400_000)

    toImport.push({
      name,
      startDate,
      endDate,
      plan:          String(row[planIdx] ?? '').trim() || '包年',
      priceLevel:    String(row[priceIdx] ?? '').trim() || '原价',
      notes:         notesIdx >= 0 ? (String(row[notesIdx] ?? '').trim() || null) : null,
      pageOnePager:  toBool(row[11]),
      pageCollectOld: toBool(row[12]),
      pageCollectNew: toBool(row[12]),
      badgeCopyEn:    clean(row[15]),  // 新用戶文案 → 當地語言
      badgeCopyLocal: null,             // 英文欄位手動填寫
      marketIds:     resolveMarketIds(String(row[regionIdx] ?? '').trim(), marketByCode),
    })
  }

  // Step 1: record the current max ID so we can isolate newly inserted rows
  const { _max } = await prisma.activity.aggregate({ _max: { id: true } })
  const prevMaxId = _max.id ?? 0

  const now = new Date()

  // Step 2: bulk-create activities
  await prisma.activity.createMany({
    data: toImport.map((d) => {
      const hasStarted = d.startDate <= now
      return {
        name: d.name, startDate: d.startDate, endDate: d.endDate,
        plan: d.plan, priceLevel: d.priceLevel, labels: '[]',
        notes: d.notes, pageOnePager: d.pageOnePager,
        pageCollectOld: d.pageCollectOld, pageCollectNew: d.pageCollectNew,
        badgeCopyEn: d.badgeCopyEn, badgeCopyLocal: d.badgeCopyLocal,
        product,
        status: hasStarted ? '已配置' : '未配置',
        notified: hasStarted,
      }
    }),
  })

  // Step 3: fetch ONLY the newly created rows (id > prevMaxId, same product, in insert order)
  const inserted = await prisma.activity.findMany({
    where: { id: { gt: prevMaxId }, product },
    select: { id: true },
    orderBy: { id: 'asc' },
  })

  // Step 4: build market links; assert length matches before linking
  if (inserted.length !== toImport.length) {
    throw new Error(`Insert count mismatch: expected ${toImport.length}, got ${inserted.length}`)
  }
  const marketLinks = inserted.flatMap((act, idx) =>
    [...new Set(toImport[idx].marketIds)].map(mid => ({ activityId: act.id, marketId: mid }))
  )
  if (marketLinks.length > 0) {
    await prisma.activityOnMarket.createMany({ data: marketLinks })
  }

  // Debug
  const debug = {
    headerRow: rows[headerIdx],
    regionIdx,
    regionSamples: [...new Set(
      (rows.slice(headerIdx + 1) as (string | number)[][])
        .map((row) => String(row[regionIdx] ?? '').trim())
        .filter(Boolean)
    )],
  }

  return NextResponse.json({ imported: toImport.length, debug })
  } catch (err) {
    console.error('[import error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
