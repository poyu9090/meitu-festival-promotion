import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const markets = await prisma.market.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(markets)
}

export async function POST(req: Request) {
  const { name, code } = await req.json()
  const market = await prisma.market.create({ data: { name, code } })
  return NextResponse.json(market, { status: 201 })
}
