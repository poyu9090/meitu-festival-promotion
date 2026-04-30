export type Market = {
  id: number
  name: string
  code: string
  createdAt: string
}

export type ActivityImage = {
  id: number
  activityId: number
  filename: string
  path: string
  createdAt: string
}

export type ActivityMetric = {
  id: number
  activityId: number
  marketId: number
  market: Market
  dau: number | null
  revenue: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Activity = {
  id: number
  product: string
  name: string
  startDate: string
  endDate: string
  plan: string
  priceLevel: string
  labels: string
  notes: string | null
  pageOnePager: boolean
  pageCollectOld: boolean
  pageCollectNew: boolean
  badgeCopyEn: string | null
  badgeCopyLocal: string | null
  status: string
  notified: boolean
  markets: { activity: Activity; activityId: number; market: Market; marketId: number }[]
  images: ActivityImage[]
  metrics: ActivityMetric[]
  createdAt: string
  updatedAt: string
}
