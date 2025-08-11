/**
 * Página de callback para confirmación de email y establecimiento de contraseña
 * Maneja el proceso de invitación de usuarios
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar si hay hash fragments (Supabase usa #)
        const hash = window.location.hash
        
        if (hash) {
          // Parsear parámetros del hash
          const hashParams = new URLSearchParams(hash.substring(1))
          const type = hashParams.get('type')
          const accessToken = hashParams.get('access_token')
          
          if (type === 'invite' && accessToken) {
            // Es una invitación, procesar manualmente
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionData.session?.user) {
              // Verificar si el usuario necesita establecer contraseña
              // Los usuarios invitados tienen email_confirmed_at pero no han establecido contraseña
              const user = sessionData.session.user
              
              if (user.email_confirmed_at && user.created_at) {
                const createdAt = new Date(user.created_at)
                const confirmedAt = new Date(user.email_confirmed_at)
                const timeDiff = Math.abs(confirmedAt.getTime() - createdAt.getTime())
                
                // Si se confirmó muy rápido (menos de 1 minuto), es invitación
                if (timeDiff < 60000) {
                  setUserEmail(user.email || '')
                  setIsValidToken(true)
                  setLoading(false)
                  return
                }
              }
            }
          }
        }
        
        // Método alternativo: verificar sesión actual
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError('Link de invitación inválido o expirado')
          setLoading(false)
          return
        }

        if (data.session?.user) {
          // Si ya hay sesión, ir al dashboard
          router.push('/dashboard')
          return
        }

        // Si llegamos aquí, no hay sesión válida
        setError('Link de invitación inválido o expirado')
        
      } catch (err) {
        console.error('Callback error:', err)
        setError('Error procesando la invitación')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      // Actualizar la contraseña del usuario
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      // Redirigir al dashboard
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('Error setting password:', error)
      setError(error.message || 'Error estableciendo la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F5F7] via-white to-[#87E0E0] flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#5FD3D2] mb-4" />
          <p className="text-[#004C4C] font-medium">Procesando invitación...</p>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F5F7] via-white to-[#87E0E0] flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#004C4C] mb-2">
            Invitación Inválida
          </h1>
          <p className="text-[#065C5C] mb-6">
            {error || 'El link de invitación es inválido o ha expirado.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-[#5FD3D2] text-white rounded-lg hover:bg-[#58BFC2] transition-colors font-medium"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F5F7] via-white to-[#87E0E0] flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#004C4C] mb-2">
            ¡Bienvenido a GOOD Talent!
          </h1>
          <p className="text-[#065C5C]">
            Hola <span className="font-medium">{userEmail}</span>, establece tu contraseña para completar el registro.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6">
          {/* Nueva contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#004C4C] mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5FD3D2] focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#004C4C] mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5FD3D2] focus:border-transparent"
                placeholder="Repite tu contraseña"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full py-3 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all disabled:opacity-50 font-medium flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Estableciendo contraseña...</span>
              </>
            ) : (
              <span>Establecer contraseña</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
