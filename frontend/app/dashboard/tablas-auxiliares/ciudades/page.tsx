/**
 * Página CRUD para gestión de Ciudades
 * Permite crear, editar, eliminar y listar ciudades
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/usePermissions'
import { supabase } from '@/lib/supabaseClient'
import { MapPin, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import ResponsiveDataTable from '@/components/ui/ResponsiveDataTable'
import AuxiliaryTableModal from '@/components/ui/AuxiliaryTableModal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import Toast from '@/components/dashboard/Toast'

interface Ciudad {
  id: string
  nombre: string
  created_at: string
  updated_at: string
}

export default function CiudadesPage() {
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRef, setLoadingRef] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Ciudad | null>(null)
  
  // Estados de carga específicos
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Toast
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  const router = useRouter()
  const { canManageAuxTables, hasPermission, loading: permissionsLoading, permissions } = usePermissions()

  // Verificar permisos
  const canView = canManageAuxTables()
  const canCreate = hasPermission('tablas_auxiliares', 'create')
  const canEdit = hasPermission('tablas_auxiliares', 'edit')
  const canDelete = hasPermission('tablas_auxiliares', 'delete')

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!permissionsLoading && !canView) {
      router.push('/dashboard')
    }
  }, [canView, permissionsLoading, router])

  // Cargar datos
  const loadData = async () => {
    if (loadingRef) return
    
    // Check cache first
    const cached = localStorage.getItem('ciudades_cache')
    if (cached && !dataLoaded) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 300000) { // 5min cache
        setCiudades(parsed.data)
        setDataLoaded(true)
        setLoading(false)
        return
      }
      localStorage.removeItem('ciudades_cache')
    }
    
    setLoadingRef(true)
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error loading ciudades:', error)
        showToast('Error al cargar las ciudades', 'error')
        return
      }

      const ciudadesData = data || []
      
      // Save to cache
      localStorage.setItem('ciudades_cache', JSON.stringify({
        data: ciudadesData,
        timestamp: Date.now()
      }))
      
      setCiudades(ciudadesData)
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading ciudades:', error)
      showToast('Error al cargar las ciudades', 'error')
    } finally {
      setLoading(false)
      setLoadingRef(false)
    }
  }

  useEffect(() => {
    const shouldLoad = !permissionsLoading && permissions.length > 0 && canView && !dataLoaded && !loadingRef
    if (shouldLoad) {
      loadData()
    } else if (dataLoaded) {
      setLoading(false)
    }
  }, [permissionsLoading, permissions.length, canView, dataLoaded])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
  }

  // Crear ciudad
  const handleCreate = async (formData: any) => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id

    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('ciudades')
      .insert([{
        nombre: formData.nombre.trim(),
        created_by: userId,
        updated_by: userId
      }])

    if (error) {
      console.error('Error creating ciudad:', error)
      throw new Error(error.message)
    }

    // Clear cache and reload
    localStorage.removeItem('ciudades_cache')
    await loadData()
    showToast('Ciudad creada exitosamente', 'success')
  }

  // Editar ciudad
  const handleEdit = async (formData: any) => {
    if (!selectedRecord) return

    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id

    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('ciudades')
      .update({
        nombre: formData.nombre.trim(),
        updated_by: userId
      })
      .eq('id', selectedRecord.id)

    if (error) {
      console.error('Error updating ciudad:', error)
      throw new Error(error.message)
    }

    // Clear cache and reload
    localStorage.removeItem('ciudades_cache')
    await loadData()
    showToast('Ciudad actualizada exitosamente', 'success')
  }

  // Eliminar ciudad
  const handleDelete = async () => {
    if (!selectedRecord) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('ciudades')
        .delete()
        .eq('id', selectedRecord.id)

      if (error) {
        console.error('Error deleting ciudad:', error)
        throw new Error(error.message)
      }

      // Clear cache and reload
      localStorage.removeItem('ciudades_cache')
      await loadData()
      showToast('Ciudad eliminada exitosamente', 'success')
      setShowDeleteModal(false)
      setSelectedRecord(null)
    } catch (error: any) {
      console.error('Error deleting ciudad:', error)
      showToast(error.message || 'Error al eliminar la ciudad', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Configuración de la tabla
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      mobileShow: true
    },
    {
      key: 'created_at',
      label: 'Fecha Creación',
      sortable: true,
      mobileShow: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-ES')
    }
  ]

  // Configuración de acciones
  const actions = [
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      color: 'blue' as const,
      onClick: (record: Ciudad) => {
        setSelectedRecord(record)
        setShowEditModal(true)
      },
      show: () => canEdit
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      color: 'red' as const,
      onClick: (record: Ciudad) => {
        setSelectedRecord(record)
        setShowDeleteModal(true)
      },
      show: () => canDelete
    }
  ]

  // Configuración del formulario
  const formFields = [
    {
      key: 'nombre',
      label: 'Nombre de la Ciudad',
      type: 'text' as const,
      required: true,
      placeholder: 'Ej: Bogotá, Medellín, Cali...'
    }
  ]

  if (permissionsLoading || !canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5FD3D2]"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => router.push('/dashboard/tablas-auxiliares')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#004C4C]">Ciudades</h1>
              <p className="text-[#065C5C] text-sm">
                Gestiona las ciudades principales de Colombia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <ResponsiveDataTable
        data={ciudades}
        columns={columns}
        actions={actions}
        loading={loading}
        searchPlaceholder="Buscar ciudades..."
        onAdd={canCreate ? () => setShowCreateModal(true) : undefined}
        canCreate={canCreate}
        emptyMessage="No hay ciudades registradas"
        addButtonText="Agregar Ciudad"
        mobileTitle={(record) => record.nombre}
        mobileSubtitle={(record) => `Agregada el ${new Date(record.created_at).toLocaleDateString('es-ES')}`}
        mobileBadge={() => (
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Ciudad</span>
          </div>
        )}
      />

      {/* Modal Crear */}
      <AuxiliaryTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
        title="Agregar Nueva Ciudad"
        fields={formFields}
        onSubmit={handleCreate}
      />

      {/* Modal Editar */}
      <AuxiliaryTableModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedRecord(null)
        }}
        onSuccess={() => {
          setShowEditModal(false)
          setSelectedRecord(null)
        }}
        title="Editar Ciudad"
        record={selectedRecord}
        fields={formFields}
        onSubmit={handleEdit}
      />

      {/* Modal Eliminar */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedRecord(null)
        }}
        onConfirm={handleDelete}
        title="Eliminar Ciudad"
        message="¿Estás seguro de que deseas eliminar esta ciudad?"
        recordName={selectedRecord?.nombre}
        loading={deleting}
      />

      {/* Toast */}
      <Toast
        open={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}
