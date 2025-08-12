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
      console.log('🔍 Sending invite request:', {
        email,
        redirectTo: `${window.location.origin}/auth/callback`,
        origin: window.location.origin,
        timestamp: new Date().toISOString()
      })

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

      console.log('🔍 Invite API response:', {
        ok: response.ok,
        status: response.status,
        result,
        timestamp: new Date().toISOString()
      })

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

      // Procesar permisos de manera más robusta
      const permissionErrors: string[] = []
      
      for (const [tableName, actions] of Object.entries(selectedPermissions)) {
        for (const action of actions) {
          try {
            // Obtener el ID del permiso
            const { data: permissionData, error: permissionError } = await supabase
              .from('permissions')
              .select('id')
              .eq('table_name', tableName)
              .eq('action', action)
              .single()

            if (permissionError || !permissionData) {
              console.error(`Error finding permission for ${tableName}.${action}:`, permissionError)
              permissionErrors.push(`${tableName}.${action}`)
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
              permissionErrors.push(`${tableName}.${action}`)
            }
          } catch (permError) {
            console.error(`Error processing permission ${tableName}.${action}:`, permError)
            permissionErrors.push(`${tableName}.${action}`)
          }
        }
      }

      // Mostrar advertencia si hubo errores en permisos, pero continuar
      if (permissionErrors.length > 0) {
        console.warn('Some permissions could not be assigned:', permissionErrors)
      }

      // Éxito - resetear estado ANTES de llamar callbacks
      resetForm() // Limpiar estado inmediatamente
      
      // Llamar callbacks después del reset
      onSuccess() // Esto debe refrescar la lista de usuarios
      onClose()   // Esto cierra el modal con estado limpio

    } catch (error: any) {
      console.error('Error inviting user:', error)
      setError(error.message || 'Error al invitar usuario')
      setLoading(false) // Solo resetear loading en caso de error
    }
  }

  const resetForm = () => {
    setEmail('')
    setSelectedPermissions({})
    setStep('email')
    setError('')
    setLoading(false)
    
    // Limpiar cualquier timeout o promise pendiente
    // Esto es importante para evitar estados inconsistentes
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const renderEmailStep = () => (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#87E0E0] bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#004C4C]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-[#004C4C] truncate">Invitar Usuario</h3>
              <p className="text-xs sm:text-sm text-[#065C5C] truncate">Paso 1: Ingresa el email del usuario</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
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
        </div>

        {/* Spacer to ensure footer doesn't overlap content */}
        <div className="h-4 sm:h-6 flex-shrink-0"></div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:justify-end">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-center rounded-lg"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleEmailSubmit}
            disabled={loading || !email.trim()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all disabled:opacity-50 font-medium"
          >
            <span className="text-sm">Continuar</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderPermissionsStep = () => (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#87E0E0] bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#004C4C]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-[#004C4C] truncate">Asignar Permisos</h3>
              <p className="text-xs sm:text-sm text-[#065C5C] truncate">Selecciona permisos para {email}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Permissions List */}
        <div className="space-y-3 sm:space-y-4">
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
                <div key={tableName} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => toggleAllTablePermissions(tableName, actions)}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          hasAllPermissions
                            ? 'bg-[#5FD3D2] border-[#5FD3D2] text-white'
                            : hasPartialPermissions
                            ? 'bg-[#5FD3D2] border-[#5FD3D2]'
                            : 'border-gray-300 hover:border-[#5FD3D2]'
                        }`}
                        disabled={loading}
                      >
                        {hasAllPermissions && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        {hasPartialPermissions && !hasAllPermissions && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                        )}
                      </button>
                      <h4 className="font-medium text-sm sm:text-base text-[#004C4C] capitalize">
                        {tableName.replace('_', ' ')}
                      </h4>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {selectedActions.length}/{permissions.length} seleccionados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {permissions.map((permission) => {
                      const isSelected = selectedActions.includes(permission.action)
                      
                      return (
                        <button
                          key={permission.id}
                          onClick={() => togglePermission(tableName, permission.action)}
                          className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-[#87E0E0] bg-opacity-20 text-[#004C4C] border-2 border-[#5FD3D2]'
                              : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent'
                          }`}
                          disabled={loading}
                        >
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-[#5FD3D2] border-[#5FD3D2] text-white'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium">{permission.action}</div>
                            <div className="text-xs text-gray-500 truncate hidden sm:block">{permission.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Spacer to ensure footer doesn't overlap content */}
        <div className="h-4 sm:h-6 flex-shrink-0"></div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            {getSelectedPermissionsCount()} permiso{getSelectedPermissionsCount() !== 1 ? 's' : ''} seleccionado{getSelectedPermissionsCount() !== 1 ? 's' : ''}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setStep('email')}
              className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-center rounded-lg"
              disabled={loading}
            >
              Atrás
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={loading || getSelectedPermissionsCount() === 0}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all disabled:opacity-50 font-medium"
            >
              <span className="text-sm">Revisar Invitación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#87E0E0] bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#004C4C]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-[#004C4C] truncate">Confirmar Invitación</h3>
              <p className="text-xs sm:text-sm text-[#065C5C] truncate">Paso 3: Revisa y envía la invitación</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
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

        {/* Spacer to ensure footer doesn't overlap content */}
        <div className="h-4 sm:h-6 flex-shrink-0"></div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:justify-between">
          <button
            onClick={() => setStep('permissions')}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-center rounded-lg"
            disabled={loading}
          >
            Atrás
          </button>
          <button
            onClick={handleInviteUser}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all disabled:opacity-50 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Enviando invitación...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Enviar Invitación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  const getModalSize = () => {
    if (step === 'permissions') {
      return 'w-full max-w-4xl h-[95vh] sm:h-[90vh]' // Grande para permisos
    }
    return 'w-full max-w-2xl max-h-[80vh] sm:max-h-[75vh]' // Más pequeño para email y confirmación
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
      <div className={`bg-white rounded-lg sm:rounded-xl shadow-xl flex flex-col ${getModalSize()}`}>
        {step === 'email' && renderEmailStep()}
        {step === 'permissions' && renderPermissionsStep()}
        {step === 'confirm' && renderConfirmStep()}
      </div>
    </div>
  )
}

