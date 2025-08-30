import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'MOA',
  description: 'Created BY KUKUNET',
  generator: 'MOA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
// app/layout.tsx
return (
  <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
    <body>{children}</body>
  </html>
)
}
