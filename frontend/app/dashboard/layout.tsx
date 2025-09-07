'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '../../lib/usePermissions'
import Sidebar from '../../components/dashboard/Sidebar'
import Header from '../../components/dashboard/Header'
import BottomNavigation from '../../components/dashboard/BottomNavigation'

/**
 * Layout principal del dashboard con autenticación y navegación
 * Ahora usa el contexto global de permisos para evitar verificaciones duplicadas
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = usePermissions()
  const router = useRouter()

  // Redirigir si no hay usuario logueado
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔄 No user found, redirecting to login')
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#87E0E0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#065C5C] font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Se está redirigiendo
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </div>
  )
}
