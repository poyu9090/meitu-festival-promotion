import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const { marketId, dau, revenue, notes } = await req.json()

  const metric = await prisma.activityMetric.upsert({
    where: { activityId_marketId: { activityId: parseInt(id), marketId } },
    update: { dau, revenue, notes },
    create: { activityId: parseInt(id), marketId, dau, revenue, notes },
    include: { market: true },
  })
  return NextResponse.json(metric)
}
