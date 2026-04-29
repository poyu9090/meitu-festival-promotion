import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/metrics?start=2026-04-01&end=2026-04-30&markets=TH,VN,TWN
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const markets = (searchParams.get('markets') ?? '').split(',').filter(Boolean)

  if (!start || !end || markets.length === 0) {
    return NextResponse.json({ error: 'start, end, markets required' }, { status: 400 })
  }

  const rows = await (prisma as any).dailyMetric.findMany({
    where: {
      date: { gte: start, lte: end },
      marketCode: { in: markets },
    },
    orderBy: [{ date: 'asc' }, { marketCode: 'asc' }],
  })

  return NextResponse.json(rows)
}
