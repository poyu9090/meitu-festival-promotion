import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const activity = await prisma.activity.findUnique({
    where: { id: parseInt(id) },
    include: {
      markets: { include: { market: true } },
      images: true,
      metrics: { include: { market: true } },
    },
  })
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(activity)
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  // Only allow safe scalar fields via PATCH
  const allowed = ['status', 'notified', 'notes', 'labels', 'pageOnePager', 'pageCollectOld', 'pageCollectNew', 'badgeCopyEn', 'badgeCopyLocal']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
  try {
    const activity = await prisma.activity.update({
      where: { id: parseInt(id) },
      data,
      include: {
        markets: { include: { market: true } },
        images: true,
        metrics: { include: { market: true } },
      },
    })
    return NextResponse.json(activity)
  } catch (err) {
    console.error('[PATCH error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const { name, startDate, endDate, plan, priceLevel, labels, notes, marketIds,
          pageOnePager, pageCollectOld, pageCollectNew, badgeCopyEn, badgeCopyLocal, status } =
    await req.json()

  // Replace market relations
  await prisma.activityOnMarket.deleteMany({ where: { activityId: parseInt(id) } })

  const activity = await prisma.activity.update({
    where: { id: parseInt(id) },
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
      status: status ?? '未配置',
      markets: {
        create: (marketIds as number[]).map((mid) => ({ marketId: mid })),
      },
    },
    include: {
      markets: { include: { market: true } },
      images: true,
      metrics: { include: { market: true } },
    },
  })
  return NextResponse.json(activity)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  await prisma.activity.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
