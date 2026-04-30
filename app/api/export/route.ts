import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  return nums.length > 0 ? Math.round(nums.reduce((s, v) => s + v, 0) / nums.length) : null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const product = searchParams.get('product') || '美图秀秀'
  const marketId = searchParams.get('marketId')
  const since = searchParams.get('since')

  const activities = await prisma.activity.findMany({
    where: {
      product,
      ...(marketId ? { markets: { some: { marketId: parseInt(marketId) } } } : {}),
      ...(since ? { startDate: { gte: new Date(since) } } : {}),
    },
    include: { markets: { include: { market: true } } },
    orderBy: { startDate: 'desc' },
  })

  // Collect all date ranges and market codes needed
  const allCodes = [...new Set(activities.flatMap((a) => a.markets.map((m) => m.market.code)))]
  const minDate = activities.reduce((min, a) => {
    const d = toDateStr(new Date(a.startDate))
    return d < min ? d : min
  }, '9999-12-31')
  const maxDate = activities.reduce((max, a) => {
    const d = toDateStr(new Date(a.endDate))
    return d > max ? d : max
  }, '0000-01-01')

  // Single batch query for all DailyMetric rows needed
  const dailyRows = allCodes.length > 0
    ? await prisma.dailyMetric.findMany({
        where: {
          marketCode: { in: allCodes },
          date: { gte: minDate, lte: maxDate },
        },
        select: { date: true, marketCode: true, dau: true, newMembers: true },
      })
    : []

  // Build a lookup map: "YYYY-MM-DD|code" → row
  const dailyMap = new Map(dailyRows.map((r) => [`${r.date}|${r.marketCode}`, r]))

  // One row per activity × market
  const rows = activities.flatMap((a) => {
    const startStr = toDateStr(new Date(a.startDate))
    const endStr = toDateStr(new Date(a.endDate))

    return a.markets.map((m) => {
      const code = m.market.code

      // Collect daily values for this activity's date range
      const dauVals: (number | null)[] = []
      const nmVals: (number | null)[] = []
      const d = new Date(startStr + 'T00:00:00')
      const end = new Date(endStr + 'T00:00:00')
      while (d <= end) {
        const key = `${toDateStr(d)}|${code}`
        const row = dailyMap.get(key)
        dauVals.push(row?.dau ?? null)
        nmVals.push(row?.newMembers ?? null)
        d.setDate(d.getDate() + 1)
      }

      const avgDau = avg(dauVals)
      const avgNm = avg(nmVals)

      return {
        活动名称: a.name,
        市场: m.market.name,
        市场代码: code,
        开始日期: format(new Date(a.startDate), 'yyyy/MM/dd'),
        结束日期: format(new Date(a.endDate), 'yyyy/MM/dd'),
        方案: a.plan,
        价格级别: a.priceLevel,
        状态: a.status,
        已寄信: a.notified ? '是' : '否',
        DAU均值: avgDau ?? '',
        新增会员均值: avgNm ?? '',
        一页通: a.pageOnePager ? '✓' : '',
        老合辑: a.pageCollectOld ? '✓' : '',
        新合辑: a.pageCollectNew ? '✓' : '',
        角标文案英文: a.badgeCopyEn ?? '',
        角标文案本地: a.badgeCopyLocal ?? '',
        备注: a.notes ?? '',
      }
    })
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '活动列表')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `活动列表_${product}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
