import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const satoshi = localFont({
  src: '../fonts/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2',
  variable: '--font-satoshi',
})

const generalSans = localFont({
  src: '../fonts/GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Variable.woff2',
  variable: '--font-general-sans',
})

const boska = localFont({
  src: '../fonts/Boska_Complete/Fonts/WEB/fonts/Boska-Variable.woff2',
  variable: '--font-boska',
})

const array = localFont({
  src: '../fonts/Array_Complete/Fonts/WEB/fonts/Array-Bold.woff2',
  variable: '--font-array',
})

export const metadata: Metadata = {
  title: 'Fantasy Travel Guide',
  description: 'Plan your perfect trip with AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${satoshi.variable} ${generalSans.variable} ${boska.variable} ${array.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
