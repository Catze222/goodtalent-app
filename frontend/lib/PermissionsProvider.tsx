/**
 * Context Provider global para gestión de permisos
 * Carga los permisos UNA SOLA VEZ por sesión y los mantiene en memoria
 */

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export interface UserPermission {
  table_name: string
  action: string
  description: string
  granted_at: string
}

interface PermissionsContextType {
  // Estado del usuario y permisos
  user: User | null
  permissions: UserPermission[]
  loading: boolean
  
  // Funciones de verificación
  hasPermission: (tableName: string, action: string) => boolean
  canManageUsers: () => boolean
  isSuperAdmin: () => boolean
  
  // Funciones de control
  refreshPermissions: () => Promise<void>
  forceRefresh: () => void
  logout: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

interface PermissionsProviderProps {
  children: React.ReactNode
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Cache de permisos - solo recargar si han pasado más de 5 minutos
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
  
  // Session refresh automático cada 30 segundos para evitar problemas de inactividad
  const SESSION_CHECK_INTERVAL = 30 * 1000 // 30 segundos

  const fetchUserPermissions = useCallback(async (currentUser: User) => {
    // Verificar cache en localStorage
    const cacheKey = `permissions_${currentUser.id}`
    const cachedData = localStorage.getItem(cacheKey)
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        const cacheAge = Date.now() - parsed.timestamp
        
        if (cacheAge < CACHE_DURATION) {
          setPermissions(parsed.permissions)
          setLastFetch(new Date(parsed.timestamp))
          return
        } else {
          localStorage.removeItem(cacheKey)
        }
      } catch (e) {
        localStorage.removeItem(cacheKey)
      }
    }

    try {
      const { data, error } = await supabase.rpc('my_permissions')
      
      if (error) {
        console.error('Error fetching permissions:', error)
        setPermissions([])
        return
      }

      const permissionsData = data || []
      
      // Guardar en cache
      localStorage.setItem(cacheKey, JSON.stringify({
        permissions: permissionsData,
        timestamp: Date.now()
      }))
      
      setPermissions(permissionsData)
      setLastFetch(new Date())
      
    } catch (error) {
      console.error('Exception fetching permissions:', error)
      setPermissions([])
    }
  }, []) // SIN dependencias para evitar loops

  const initializeAuth = useCallback(async () => {
    if (isInitialized) {
      return
    }
    
    try {
      setLoading(true)
      
      // Obtener sesión actual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setUser(null)
        setPermissions([])
        return
      }

      if (session?.user) {
        setUser(session.user)
        // Llamar función directamente para evitar dependencias
        await fetchUserPermissions(session.user)
      } else {
        setUser(null)
        setPermissions([])
      }
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing auth:', error)
      setUser(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [isInitialized]) // Depende de isInitialized

  // Inicializar al montar - SOLO UNA VEZ
  useEffect(() => {
    initializeAuth()
  }, []) // SIN dependencias - solo al montar

  // Listener MÍNIMO para login/logout - SOLO para eventos críticos
  useEffect(() => {
    let lastEventTime = 0
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Debounce para evitar eventos duplicados
        const now = Date.now()
        if (now - lastEventTime < 1000) {
          return
        }
        lastEventTime = now
        
        if (event === 'SIGNED_IN' && session?.user && !user) {
          setUser(session.user)
          await fetchUserPermissions(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setPermissions([])
          setLastFetch(null)
          setIsInitialized(false)
          // Limpiar cache
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith('permissions_') || key.startsWith('companies_') || key.startsWith('users_')) {
              localStorage.removeItem(key)
            }
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [user]) // Depende de user para evitar duplicados

  // Logout handler - limpiar cache
  const handleLogout = useCallback(async () => {
    try {
      // Limpiar cache de localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('permissions_') || key.startsWith('companies_') || key.startsWith('users_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Limpiar estado
      setUser(null)
      setPermissions([])
      setLastFetch(null)
      setIsInitialized(false)
      
      // Llamar logout de Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }, [])

  // Session refresh simplificado - solo refrescar token si es necesario
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const now = Date.now() / 1000
          const expiresAt = session.expires_at || 0
          const timeUntilExpiry = expiresAt - now
          
          if (timeUntilExpiry < 300) {
            await supabase.auth.refreshSession()
          }
        }
      } catch (error) {
        console.warn('Session check failed:', error)
      }
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [user?.id])

  // Funciones de verificación de permisos
  const hasPermission = useCallback((tableName: string, action: string): boolean => {
    return permissions.some(
      permission => 
        permission.table_name === tableName && 
        permission.action === action
    )
  }, [permissions])

  const canManageUsers = useCallback((): boolean => {
    return hasPermission('user_permissions', 'create') && 
           hasPermission('user_permissions', 'view')
  }, [hasPermission])

  const isSuperAdmin = useCallback((): boolean => {
    return hasPermission('user_permissions', 'create') && 
           hasPermission('user_permissions', 'delete')
  }, [hasPermission])

  // Función para refrescar permisos manualmente
  const refreshPermissions = useCallback(async () => {
    if (!user) {
      console.warn('⚠️ Cannot refresh permissions: no user')
      return
    }
    
    console.log('🔄 Manual permissions refresh requested')
    setLoading(true)
    try {
      await fetchUserPermissions(user)
    } finally {
      setLoading(false)
    }
  }, [user]) // Solo depende del usuario

  // Función para forzar refresh completo
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refresh requested')
    setLastFetch(null) // Resetear cache
    if (user) {
      fetchUserPermissions(user)
    } else {
      initializeAuth()
    }
  }, [user]) // Solo depende del usuario

  // Valores del contexto
  const contextValue: PermissionsContextType = {
    user,
    permissions,
    loading,
    hasPermission,
    canManageUsers,
    isSuperAdmin,
    refreshPermissions,
    forceRefresh,
    logout: handleLogout
  }

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  )
}

// Hook para usar el contexto
export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext)
  
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  
  return context
}

// Hook para obtener permisos disponibles (mantener separado)
export function useAvailablePermissions() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('permissions')
          .select('*')
          .eq('is_active', true)
          .order('table_name', { ascending: true })
          .order('action', { ascending: true })

        if (error) {
          console.error('Error fetching available permissions:', error)
          return
        }

        setPermissions(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  // Agrupar permisos por tabla
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.table_name]) {
      acc[permission.table_name] = []
    }
    acc[permission.table_name].push(permission)
    return acc
  }, {} as Record<string, any[]>)

  return {
    permissions,
    groupedPermissions,
    loading
  }
}
