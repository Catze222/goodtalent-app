/**
 * Root layout for GOOD Talent application
 * Provides global styles and metadata configuration
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GOOD Talent - Inicio de Sesión',
  description: 'Plataforma de gestión de talento - Inicia sesión en tu cuenta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}