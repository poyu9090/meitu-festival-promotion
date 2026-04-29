import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const marketId = searchParams.get('marketId')
  const product = searchParams.get('product') || '美图秀秀'

  const activities = await prisma.activity.findMany({
    where: {
      product,
      ...(marketId ? { markets: { some: { marketId: parseInt(marketId) } } } : {}),
    },
    include: {
      markets: { include: { market: true } },
      images: true,
      metrics: { include: { market: true } },
    },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json(activities)
}

export async function POST(req: Request) {
  const { name, startDate, endDate, plan, priceLevel, labels, notes, marketIds,
          pageOnePager, pageCollectOld, pageCollectNew, badgeCopyEn, badgeCopyLocal,
          product } =
    await req.json()

  const activity = await prisma.activity.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      plan,
      priceLevel,
      labels: JSON.stringify(labels ?? []),
      notes,
      pageOnePager: pageOnePager ?? false,
      pageCollectOld: pageCollectOld ?? false,
      pageCollectNew: pageCollectNew ?? false,
      badgeCopyEn: badgeCopyEn || null,
      badgeCopyLocal: badgeCopyLocal || null,
      product: product || '美图秀秀',
      markets: {
        create: (marketIds as number[]).map((mid) => ({ marketId: mid })),
      },
    },
    include: {
      markets: { include: { market: true } },
      images: true,
      metrics: true,
    },
  })
  return NextResponse.json(activity, { status: 201 })
}
