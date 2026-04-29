import ActivityForm from '@/components/ActivityForm'

export default function NewActivityPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>
          新增活动
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
          填写活动信息并选择上线市场
        </p>
      </div>
      <ActivityForm />
    </div>
  )
}
