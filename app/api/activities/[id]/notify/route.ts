import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transporter } from '@/lib/mailer'
import { differenceInDays, format } from 'date-fns'

type Params = { params: Promise<{ id: string }> }

const RECIPIENT = 'poyu909090@gmail.com'

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const activityId = parseInt(id)

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { markets: { include: { market: true } } },
  })
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const marketNames = activity.markets.map((m) => m.market.name).join('、')
  const marketIds = activity.markets.map((m) => m.marketId)

  // Find most recent past activity across the same markets (excluding self)
  const prevActivity = await prisma.activity.findFirst({
    where: {
      id: { not: activityId },
      endDate: { lt: activity.startDate },
      markets: { some: { marketId: { in: marketIds } } },
    },
    orderBy: { endDate: 'desc' },
  })

  const daysSincePrev = prevActivity
    ? differenceInDays(activity.startDate, new Date(prevActivity.endDate))
    : null

  const prevLine = prevActivity && daysSincePrev !== null
    ? `距离上次活动：${daysSincePrev} 天前（${prevActivity.name}）`
    : `距离上次活动：无历史纪录`

  const subject = `${marketNames} ${activity.name} 折扣确认`
  const text = [
    `市场：${marketNames}`,
    `走期：${format(new Date(activity.startDate), 'yyyy/MM/dd')} ～ ${format(new Date(activity.endDate), 'yyyy/MM/dd')}`,
    `折扣等级：${activity.priceLevel}`,
    prevLine,
  ].join('\n')

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 503 })
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: RECIPIENT,
      subject,
      text,
    })
  } catch (err) {
    console.error('[notify error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
