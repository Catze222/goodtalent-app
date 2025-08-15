/**
 * Root layout for GOOD Talent application
 * Provides global styles, metadata configuration and permissions context
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PermissionsProvider } from '../lib/PermissionsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GOOD Talent - Portal Corporativo',
  description: 'Sistema integral de gestión de recursos humanos y servicios legales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </body>
    </html>
  )
}