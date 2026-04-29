import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ProductProvider } from '@/components/ProductProvider'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: '秀秀活动管理',
  description: '海外运营活动管理系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${dmSans.variable} h-full`}>
      <body style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
        <ThemeProvider>
          <ProductProvider>
            <NavBar />
            <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
          </ProductProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
