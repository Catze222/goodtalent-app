/**
 * Página de gestión de usuarios y permisos
 * Solo accesible para usuarios con permisos de gestión
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/usePermissions'
import { supabase } from '@/lib/supabaseClient'
import { 
  Plus, 
  Edit, 
  Mail, 
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  UserPlus,
  Search,
  Filter,
  X,
  RotateCcw,
  Power,
  PowerOff,
  Loader2
} from 'lucide-react'
import InviteUserModal from '@/components/dashboard/InviteUserModal'
import EditUserPermissionsModal from '@/components/dashboard/EditUserPermissionsModal'
import ConfirmationModal from '@/components/dashboard/ConfirmationModal'
import NotificationModal from '@/components/dashboard/NotificationModal'

interface UserWithPermissions {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  permissions_count: number
  is_active: boolean
  is_banned: boolean
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [togglingUser, setTogglingUser] = useState<string | null>(null)
  
  // Estados para modales modernos
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type: 'warning' | 'danger' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  })
  
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })
  
  const router = useRouter()
  const { canManageUsers, loading: permissionsLoading } = usePermissions()

  // Funciones helper para modales
  const showConfirmation = (title: string, message: string, onConfirm: () => void, type: 'warning' | 'danger' | 'success' = 'warning') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    })
  }

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!permissionsLoading && !canManageUsers()) {
      router.push('/dashboard')
    }
  }, [canManageUsers, permissionsLoading, router])

  // Cargar usuarios cuando los permisos estén listos
  useEffect(() => {
    if (!permissionsLoading && canManageUsers()) {
      fetchUsers()
    }
  }, [permissionsLoading]) // Solo depende de permissionsLoading para evitar loops

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Obtener usuarios de auth.users con conteo de permisos
      const { data, error } = await supabase.rpc('get_users_with_permissions')
      
      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (user: UserWithPermissions) => {
    const { data: session } = await supabase.auth.getSession()
    const currentUserId = session.session?.user?.id
    
    // Prevenir autodesactivación en el frontend también
    if (!user.is_banned && currentUserId === user.id) {
      showNotification(
        'Acción no permitida',
        'No puedes desactivar tu propia cuenta',
        'error'
      )
      return
    }
    
    const action = user.is_banned ? 'activate' : 'deactivate'
    const actionText = action === 'activate' ? 'activar' : 'desactivar'
    
    // Confirmación para acciones críticas
    if (action === 'deactivate') {
      showConfirmation(
        'Desactivar Usuario',
        `¿Estás seguro de que quieres desactivar a ${user.email}? El usuario no podrá acceder al sistema hasta que sea reactivado.`,
        () => executeUserToggle(user, action),
        'danger'
      )
    } else {
      showConfirmation(
        'Activar Usuario',
        `¿Confirmas que quieres activar a ${user.email}? El usuario podrá acceder al sistema nuevamente.`,
        () => executeUserToggle(user, action),
        'success'
      )
    }
  }

  const executeUserToggle = async (user: UserWithPermissions, action: string) => {
    try {
      setTogglingUser(user.id)
      closeConfirmModal()
      
      const { data: session } = await supabase.auth.getSession()
      const actionText = action === 'activate' ? 'activar' : 'desactivar'
      
      const response = await fetch('/api/toggle-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: action,
          userToken: session.session?.access_token
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || `Error al ${actionText} usuario`)
      }

      // Mostrar mensaje de éxito
      showNotification(
        'Operación Exitosa',
        `Usuario ${action === 'activate' ? 'activado' : 'desactivado'} correctamente`,
        'success'
      )
      
      // Esperar un momento antes de refrescar para que Supabase procese el cambio
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refrescar la lista de usuarios
      await fetchUsers()
      
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      showNotification(
        'Error',
        error.message || 'Error al cambiar estado del usuario',
        'error'
      )
    } finally {
      setTogglingUser(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Debounce para búsqueda
  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(searchInput), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (user: UserWithPermissions) => {
    if (!user.email_confirmed_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Mail className="w-3 h-3 mr-1" />
          Pendiente
        </span>
      )
    }
    
    if (user.is_banned) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Desactivado
        </span>
      )
    }
    
    if (user.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activo
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactivo
      </span>
    )
  }

  if (permissionsLoading || !canManageUsers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5FD3D2]"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#004C4C]">
              Gestión de Usuarios
            </h1>
            <p className="text-[#065C5C] mt-1 text-sm sm:text-base">
              Administra usuarios y sus permisos en el sistema
            </p>
          </div>
          
          <button
            onClick={() => {
              setSearchTerm('') // Limpiar filtro al abrir modal
              setShowInviteModal(true)
            }}
            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white font-semibold rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all duration-200 shadow-lg"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">Invitar Usuario</span>
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5FD3D2] focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm('') }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Filtros y Limpiar */}
        <div className="flex gap-2">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          
          {(searchTerm) && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearchTerm('')
              }}
              className="inline-flex items-center px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de usuarios - Responsivo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5FD3D2] mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay usuarios
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron usuarios con ese criterio.' : 'Comienza invitando tu primer usuario.'}
            </p>
            {!searchTerm && (
          <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-[#5FD3D2] text-white rounded-lg hover:bg-[#58BFC2] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Invitar Usuario
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vista móvil - Tarjetas */}
            <div className="block lg:hidden space-y-3 p-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all hover:border-[#5FD3D2]">
                  <div className="space-y-4">
                    
                    {/* Header con nombre completo */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {user.email.split('@')[0]}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      {/* Estado - ahora en la esquina superior derecha */}
                      <div className="flex-shrink-0">
                        {getStatusBadge(user)}
                      </div>
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs font-medium">Permisos</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.permissions_count} activos
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-medium">Último acceso</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(user.last_sign_in_at)}
                        </p>
                      </div>
                    </div>

                    {/* Controles - ahora en la parte inferior separada */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                      {/* Botón Activar/Desactivar */}
                      {user.email_confirmed_at && (
                        <button
                          onClick={() => toggleUserStatus(user)}
                          disabled={togglingUser === user.id}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all text-xs font-medium ${
                            user.is_banned
                              ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          } ${togglingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {togglingUser === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.is_banned ? (
                            <Power className="w-3 h-3" />
                          ) : (
                            <PowerOff className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">
                            {user.is_banned ? 'Activar' : 'Desactivar'}
                          </span>
                        </button>
                      )}
                      
                      {/* Botón Editar Permisos */}
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-[#87E0E0] bg-opacity-20 text-[#004C4C] hover:bg-opacity-30 rounded-lg transition-colors text-xs font-medium"
                      >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último acceso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#87E0E0] to-[#5FD3D2] rounded-full flex items-center justify-center">
                          <span className="text-[#004C4C] font-semibold text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email.split('@')[0]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {user.permissions_count} permisos
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(user.last_sign_in_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* Botón Activar/Desactivar */}
                        {user.email_confirmed_at && (
                          <button
                            onClick={() => toggleUserStatus(user)}
                            disabled={togglingUser === user.id}
                            className={`inline-flex items-center px-2 py-1 border text-xs leading-4 font-medium rounded-md transition-colors ${
                              user.is_banned
                                ? 'text-green-700 bg-green-100 hover:bg-green-200 border-green-300'
                                : 'text-red-700 bg-red-100 hover:bg-red-200 border-red-300'
                            } ${togglingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={user.is_banned ? 'Activar usuario' : 'Desactivar usuario'}
                          >
                            {togglingUser === user.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : user.is_banned ? (
                              <Power className="w-3 h-3 mr-1" />
                            ) : (
                              <PowerOff className="w-3 h-3 mr-1" />
                            )}
                            {user.is_banned ? 'Activar' : 'Desactivar'}
                          </button>
                        )}
                        
                        {/* Botón Editar Permisos */}
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowEditModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-[#004C4C] bg-[#87E0E0] bg-opacity-20 hover:bg-opacity-30 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={async () => {
          try {
            // Refrescar la lista de usuarios después de una invitación exitosa
            await fetchUsers()
            setShowInviteModal(false) // Asegurar que el modal se cierre
          } catch (error) {
            console.error('Error refreshing users after invite:', error)
            // Forzar refresh de la página si falla el refresh
            window.location.reload()
          }
        }}
      />

      <EditUserPermissionsModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        onSuccess={async () => {
          try {
            // Refrescar la lista de usuarios después de editar permisos
            await fetchUsers()
            setShowEditModal(false) // Asegurar que el modal se cierre
            setSelectedUser(null)   // Limpiar usuario seleccionado
          } catch (error) {
            console.error('Error refreshing users after edit:', error)
            // Forzar refresh de la página si falla el refresh
            window.location.reload()
          }
        }}
        user={selectedUser ? { id: selectedUser.id, email: selectedUser.email } : null}
      />

      {/* Modales Modernos */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={togglingUser !== null}
        confirmText={confirmModal.type === 'danger' ? 'Desactivar' : 'Activar'}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
