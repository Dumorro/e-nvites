import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RSVP System - Confirmação de Presença',
  description: 'Sistema de confirmação de presença para eventos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
