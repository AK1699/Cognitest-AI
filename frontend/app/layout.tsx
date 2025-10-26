import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cognitest - AI-Powered Testing Platform',
  description: 'A dynamic, self-evolving testing ecosystem powered by AI. Create comprehensive test plans, automate workflows, and ensure quality with intelligent agents.',
  keywords: ['testing', 'AI', 'automation', 'QA', 'test management'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} font-medium`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
