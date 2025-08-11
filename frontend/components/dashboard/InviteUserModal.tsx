/**
 * Modal para invitar nuevos usuarios al sistema
 * Incluye selección de permisos y envío de invitación por email
 */

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAvailablePermissions } from '@/lib/usePermissions'
import { 
  X, 
  Mail, 
  UserPlus, 
  Shield, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SelectedPermissions {
  [key: string]: string[] // table_name -> actions[]
}

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<SelectedPermissions>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'permissions' | 'confirm'>('email')
  
  const { groupedPermissions, loading: permissionsLoading } = useAvailablePermissions()

  if (!isOpen) return null

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      setError('El email es requerido')
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email válido')
      return
    }
    
    setError('')
    setStep('permissions')
  }

  const togglePermission = (tableName: string, action: string) => {
    setSelectedPermissions(prev => {
      const tablePermissions = prev[tableName] || []
      const hasPermission = tablePermissions.includes(action)
      
      if (hasPermission) {
        // Remover permiso
        const newPermissions = tablePermissions.filter(a => a !== action)
        if (newPermissions.length === 0) {
          const { [tableName]: removed, ...rest } = prev
          return rest
        }
        return { ...prev, [tableName]: newPermissions }
      } else {
        // Agregar permiso
        return { ...prev, [tableName]: [...tablePermissions, action] }
      }
    })
  }

  const toggleAllTablePermissions = (tableName: string, allActions: string[]) => {
    setSelectedPermissions(prev => {
      const tablePermissions = prev[tableName] || []
      const hasAllPermissions = allActions.every(action => tablePermissions.includes(action))
      
      if (hasAllPermissions) {
        // Remover todos los permisos de esta tabla
        const { [tableName]: removed, ...rest } = prev
        return rest
      } else {
        // Agregar todos los permisos de esta tabla
        return { ...prev, [tableName]: allActions }
      }
    })
  }

  const getSelectedPermissionsCount = () => {
    return Object.values(selectedPermissions).reduce((total, actions) => total + actions.length, 0)
  }

  const handleInviteUser = async () => {
    try {
      setLoading(true)
      setError('')

      // 1. Obtener sesión actual
      const { data: session } = await supabase.auth.getSession()
      const currentUser = await supabase.auth.getUser()
      
      // 2. Invitar usuario usando API route
      const response = await fetch('/api/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/auth/callback`,
          userToken: session.session?.access_token
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al invitar usuario')
      }

      if (!result.user?.id) {
        throw new Error('No se pudo crear el usuario')
      }

      const data = { user: result.user }

      // 3. Asignar permisos seleccionados
      const assignedBy = currentUser.data.user?.id

      if (!assignedBy) {
        throw new Error('Usuario no autenticado')
      }

      for (const [tableName, actions] of Object.entries(selectedPermissions)) {
        for (const action of actions) {
          // Obtener el ID del permiso
          const { data: permissionData, error: permissionError } = await supabase
            .from('permissions')
            .select('id')
            .eq('table_name', tableName)
            .eq('action', action)
            .single()

          if (permissionError || !permissionData) {
            console.error(`Error finding permission for ${tableName}.${action}:`, permissionError)
            continue
          }

          // Asignar permiso
          const { error: assignError } = await supabase.rpc('assign_permission_to_user', {
            target_user_id: data.user.id,
            target_permission_id: permissionData.id,
            assigned_by: assignedBy
          })

          if (assignError) {
            console.error(`Error assigning permission ${tableName}.${action}:`, assignError)
          }
        }
      }

      // Éxito
      resetForm()
      onSuccess()
      onClose()

    } catch (error: any) {
      console.error('Error inviting user:', error)
      setError(error.message || 'Error al invitar usuario')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setSelectedPermissions({})
    setStep('email')
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const renderEmailStep = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#87E0E0] bg-opacity-20 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#004C4C]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#004C4C]">Invitar Usuario</h3>
            <p className="text-sm text-[#065C5C]">Paso 1: Ingresa el email del usuario</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#004C4C] mb-2">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5FD3D2] focus:border-transparent"
            placeholder="usuario@empresa.com"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleEmailSubmit}
            className="px-6 py-2 bg-[#5FD3D2] text-white rounded-lg hover:bg-[#58BFC2] transition-colors"
            disabled={loading}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )

  const renderPermissionsStep = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#87E0E0] bg-opacity-20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#004C4C]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#004C4C]">Asignar Permisos</h3>
            <p className="text-sm text-[#065C5C]">Paso 2: Selecciona los permisos para {email}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-4 mb-6">
        {permissionsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#5FD3D2]" />
            <p className="text-sm text-gray-500 mt-2">Cargando permisos...</p>
          </div>
        ) : (
          Object.entries(groupedPermissions).map(([tableName, permissions]) => {
            const actions = permissions.map(p => p.action)
            const selectedActions = selectedPermissions[tableName] || []
            const hasAllPermissions = actions.every(action => selectedActions.includes(action))
            const hasPartialPermissions = selectedActions.length > 0 && !hasAllPermissions

            return (
              <div key={tableName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAllTablePermissions(tableName, actions)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        hasAllPermissions
                          ? 'bg-[#5FD3D2] border-[#5FD3D2] text-white'
                          : hasPartialPermissions
                          ? 'bg-[#5FD3D2] border-[#5FD3D2]'
                          : 'border-gray-300 hover:border-[#5FD3D2]'
                      }`}
                    >
                      {hasAllPermissions && <Check className="w-3 h-3" />}
                      {hasPartialPermissions && !hasAllPermissions && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </button>
                    <h4 className="font-medium text-[#004C4C] capitalize">
                      {tableName.replace('_', ' ')}
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedActions.length}/{actions.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {permissions.map((permission) => {
                    const isSelected = selectedActions.includes(permission.action)
                    return (
                      <button
                        key={permission.id}
                        onClick={() => togglePermission(tableName, permission.action)}
                        className={`flex items-center space-x-2 p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-[#87E0E0] bg-opacity-20 text-[#004C4C]'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#5FD3D2] border-[#5FD3D2] text-white'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-sm">{permission.action}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {getSelectedPermissionsCount()} permisos seleccionados
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setStep('email')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={() => setStep('confirm')}
            className="px-6 py-2 bg-[#5FD3D2] text-white rounded-lg hover:bg-[#58BFC2] transition-colors"
            disabled={getSelectedPermissionsCount() === 0}
          >
            Revisar
          </button>
        </div>
      </div>
    </div>
  )

  const renderConfirmStep = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#87E0E0] bg-opacity-20 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-[#004C4C]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#004C4C]">Confirmar Invitación</h3>
            <p className="text-sm text-[#065C5C]">Paso 3: Revisa y envía la invitación</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-[#004C4C] mb-2">Usuario a invitar:</h4>
          <p className="text-gray-700">{email}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-[#004C4C] mb-3">
            Permisos asignados ({getSelectedPermissionsCount()}):
          </h4>
          <div className="space-y-2">
            {Object.entries(selectedPermissions).map(([tableName, actions]) => (
              <div key={tableName} className="flex flex-wrap gap-1">
                <span className="text-sm text-gray-600 capitalize font-medium mr-2">
                  {tableName.replace('_', ' ')}:
                </span>
                {actions.map((action) => (
                  <span
                    key={action}
                    className="inline-block px-2 py-1 bg-[#87E0E0] bg-opacity-30 text-[#004C4C] text-xs rounded-full"
                  >
                    {action}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => setStep('permissions')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={loading}
        >
          Atrás
        </button>
        <button
          onClick={handleInviteUser}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando invitación...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Enviar Invitación</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 'email' && renderEmailStep()}
          {step === 'permissions' && renderPermissionsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  )
}
