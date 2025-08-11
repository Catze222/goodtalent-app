/**
 * Hook personalizado para verificar permisos de usuario
 * Integra con el sistema de permisos basado en RLS
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js'

export interface Permission {
  id: string
  table_name: string
  action: string
  description: string
  is_active: boolean
}

export interface UserPermission {
  table_name: string
  action: string
  description: string
  granted_at: string
}

export function usePermissions() {
  const [user, setUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await fetchUserPermissions()
      }
      setLoading(false)
    }

    // Obtener permisos del usuario actual
    const fetchUserPermissions = async () => {
      try {
        const { data, error } = await supabase.rpc('my_permissions')
        
        if (error) {
          // Si la función no existe, asumir que no hay permisos
          if (error.code === 'PGRST202' || error.message?.includes('function my_permissions')) {
            setUserPermissions([])
            return
          }
          
          console.error('Error fetching permissions:', error)
          setUserPermissions([])
          return
        }

        setUserPermissions(data || [])
      } catch (error) {
        console.error('Error fetching permissions:', error)
        setUserPermissions([])
      }
    }

    getUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserPermissions()
        } else {
          setUserPermissions([])
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (tableName: string, action: string): boolean => {
    return userPermissions.some(
      permission => 
        permission.table_name === tableName && 
        permission.action === action
    )
  }

  // Verificar si el usuario puede gestionar usuarios
  const canManageUsers = (): boolean => {
    return hasPermission('user_permissions', 'create') && 
           hasPermission('user_permissions', 'view')
  }

  // Verificar si es super admin
  const isSuperAdmin = (): boolean => {
    return hasPermission('user_permissions', 'create') && 
           hasPermission('user_permissions', 'delete')
  }

  // Refrescar permisos
  const refreshPermissions = async () => {
    if (user) {
      try {
        const { data, error } = await supabase.rpc('my_permissions')
        
        if (error) {
          // Si la función no existe, asumir que no hay permisos
          if (error.code === 'PGRST202' || error.message?.includes('function my_permissions')) {
            console.warn('Function my_permissions not found during refresh.')
            setUserPermissions([])
            return
          }
          
          console.error('Error refreshing permissions:', error)
          setUserPermissions([])
          return
        }
        
        setUserPermissions(data || [])
      } catch (error) {
        console.error('Error refreshing permissions:', error)
        setUserPermissions([])
      }
    }
  }

  return {
    user,
    userPermissions,
    loading,
    hasPermission,
    canManageUsers,
    isSuperAdmin,
    refreshPermissions
  }
}

// Hook para obtener todos los permisos disponibles
export function useAvailablePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
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
          console.error('Error fetching permissions:', error)
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
  }, {} as Record<string, Permission[]>)

  return {
    permissions,
    groupedPermissions,
    loading
  }
}
