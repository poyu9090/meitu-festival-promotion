'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Activity } from '@/lib/types'
import ActivityForm from '@/components/ActivityForm'

export default function EditActivityPage() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<Activity | null>(null)

  useEffect(() => {
    fetch(`/api/activities/${id}`).then((r) => r.json()).then(setActivity)
  }, [id])

  if (!activity) return (
    <div style={{ color: 'var(--text-3)', fontSize: '13px', paddingTop: '64px', textAlign: 'center' }}>载入中...</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
          编辑活动
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>{activity.name}</p>
      </div>
      <ActivityForm activity={activity} />
    </div>
  )
}
