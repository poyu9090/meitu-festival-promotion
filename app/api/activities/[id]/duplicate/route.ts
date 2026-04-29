import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const source = await prisma.activity.findUnique({
    where: { id: parseInt(id) },
    include: { markets: true },
  })
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const copy = await prisma.activity.create({
    data: {
      name: `${source.name}（复制）`,
      startDate: source.startDate,
      endDate: source.endDate,
      plan: source.plan,
      priceLevel: source.priceLevel,
      labels: source.labels,
      notes: source.notes,
      pageOnePager: source.pageOnePager,
      pageCollectOld: source.pageCollectOld,
      pageCollectNew: source.pageCollectNew,
      badgeCopyEn: source.badgeCopyEn,
      badgeCopyLocal: source.badgeCopyLocal,
      status: '未配置',
      markets: {
        create: source.markets.map((m) => ({ marketId: m.marketId })),
      },
    },
    include: {
      markets: { include: { market: true } },
      images: true,
      metrics: { include: { market: true } },
    },
  })
  return NextResponse.json(copy, { status: 201 })
}
