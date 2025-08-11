'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Sidebar from '../../components/dashboard/Sidebar'
import Header from '../../components/dashboard/Header'
import BottomNavigation from '../../components/dashboard/BottomNavigation'

/**
 * Layout principal del dashboard con autenticación y navegación
 * Verifica que el usuario esté logueado antes de mostrar contenido
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación al cargar
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          router.push('/')
          return
        }

        setUser(session.user)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/')
        } else if (session) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

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
        <Header user={user} />
        
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </div>
  )
}
