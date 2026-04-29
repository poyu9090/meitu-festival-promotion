'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { useProduct, type Product } from './ProductProvider'

const PRODUCT_ICONS: Record<string, string> = {
  '美图秀秀': '/meitu_icon.png',
  '美颜相机': '/beautycam_icon.png',
  'Wink':    '/wink_icon.png',
}

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/activities', label: '活动列表' },
  { href: '/calendar', label: '活动月历' },
  { href: '/settings', label: '设定' },
]

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export default function NavBar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const { product, setProduct, products } = useProduct()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background 0.25s ease, border-color 0.25s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent-glow)',
          transition: 'background 0.25s, box-shadow 0.25s',
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.02em', transition: 'color 0.25s' }}>
          海外美图节庆优惠管理
        </span>
      </div>

      {/* Nav links */}
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))
        return (
          <Link key={l.href} href={l.href} style={{
            fontSize: '13px',
            color: active ? 'var(--text-1)' : 'var(--text-2)',
            textDecoration: 'none',
            position: 'relative',
            paddingBottom: '2px',
            transition: 'color 0.15s',
          }}>
            {l.label}
            {active && (
              <span style={{
                position: 'absolute',
                bottom: '-17px',
                left: 0, right: 0,
                height: '1px',
                background: 'var(--accent)',
                transition: 'background 0.25s',
              }} />
            )}
          </Link>
        )
      })}

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Product switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 500,
              color: 'var(--text-2)',
              background: 'transparent',
              border: '1px solid var(--border-strong)',
              borderRadius: '7px',
              padding: '5px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <Image src={PRODUCT_ICONS[product]} alt={product} width={16} height={16} style={{ borderRadius: '4px' }} />
            {product}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {open && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '9px', padding: '4px',
                minWidth: '130px', zIndex: 50,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
                {products.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setProduct(p as Product); setOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                      width: '100%', padding: '7px 10px',
                      fontSize: '12px', fontWeight: p === product ? 600 : 400,
                      color: p === product ? 'var(--text-1)' : 'var(--text-2)',
                      background: p === product ? 'var(--surface-2)' : 'transparent',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      textAlign: 'left', whiteSpace: 'nowrap',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (p !== product) e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={(e) => { if (p !== product) e.currentTarget.style.background = 'transparent' }}
                  >
                    <Image src={PRODUCT_ICONS[p]} alt={p} width={16} height={16} style={{ borderRadius: '4px', flexShrink: 0 }} />
                    {p}
                    {p === product && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? '切换浅色' : '切换深色'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '7px',
            border: '1px solid var(--border-strong)',
            background: 'transparent',
            color: 'var(--text-2)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-2)'
            e.currentTarget.style.color = 'var(--text-1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* CTA */}
        <Link href="/activities/new" style={{
          fontSize: '12px',
          fontWeight: 600,
          background: 'var(--accent)',
          color: theme === 'dark' ? '#0C0C0F' : '#1C1917',
          padding: '6px 14px',
          borderRadius: '6px',
          textDecoration: 'none',
          letterSpacing: '0.02em',
          transition: 'background 0.25s, opacity 0.15s',
          whiteSpace: 'nowrap',
        }}>
          ＋ 新增活动
        </Link>
      </div>
    </nav>
  )
}
