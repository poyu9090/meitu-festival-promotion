import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const product = searchParams.get('product')

  try {
    if (type === 'activities') {
      const where = product ? { product } : {}
      const toDelete = await prisma.activity.findMany({ where, select: { id: true } })
      const ids = toDelete.map((a) => a.id)
      if (ids.length > 0) {
        await prisma.activityMetric.deleteMany({ where: { activityId: { in: ids } } })
        await prisma.activityImage.deleteMany({ where: { activityId: { in: ids } } })
        await prisma.activityOnMarket.deleteMany({ where: { activityId: { in: ids } } })
        await prisma.activity.deleteMany({ where: { id: { in: ids } } })
      }
      return NextResponse.json({ deleted: ids.length })
    }

    if (type === 'metrics') {
      const { count } = await prisma.dailyMetric.deleteMany({})
      return NextResponse.json({ deleted: count })
    }

    if (type === 'dau') {
      const { count } = await prisma.dailyMetric.updateMany({ data: { dau: null } })
      return NextResponse.json({ updated: count })
    }

    if (type === 'new_members') {
      const { count } = await prisma.dailyMetric.updateMany({ data: { newMembers: null } })
      return NextResponse.json({ updated: count })
    }

    if (type === 'all') {
      const where = product ? { product } : {}
      const toDelete = await prisma.activity.findMany({ where, select: { id: true } })
      const ids = toDelete.map((a) => a.id)
      if (ids.length > 0) {
        await prisma.activityMetric.deleteMany({ where: { activityId: { in: ids } } })
        await prisma.activityImage.deleteMany({ where: { activityId: { in: ids } } })
        await prisma.activityOnMarket.deleteMany({ where: { activityId: { in: ids } } })
        await prisma.activity.deleteMany({ where: { id: { in: ids } } })
      }
      await prisma.dailyMetric.deleteMany({})
      return NextResponse.json({ deleted: ids.length })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('[clear error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
