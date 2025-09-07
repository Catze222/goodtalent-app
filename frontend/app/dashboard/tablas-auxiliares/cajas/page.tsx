/**
 * Página CRUD para gestión de Cajas de Compensación
 * Permite crear, editar, eliminar y listar cajas con relación a ciudades
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/usePermissions'
import { supabase } from '@/lib/supabaseClient'
import { Building, ArrowLeft, Edit, Trash2, MapPin } from 'lucide-react'
import ResponsiveDataTable from '@/components/ui/ResponsiveDataTable'
import AuxiliaryTableModal from '@/components/ui/AuxiliaryTableModal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import Toast from '@/components/dashboard/Toast'

interface CajaCompensacion {
  id: string
  nombre: string
  ciudad_id: string
  ciudad_nombre?: string
  created_at: string
  updated_at: string
}

interface Ciudad {
  id: string
  nombre: string
}

export default function CajasPage() {
  const [cajas, setCajas] = useState<CajaCompensacion[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRef, setLoadingRef] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<CajaCompensacion | null>(null)
  
  // Estados de carga específicos
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

  // Cargar ciudades
  const loadCiudades = async () => {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select('id, nombre')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error loading ciudades:', error)
        return
      }

      setCiudades(data || [])
    } catch (error) {
      console.error('Error loading ciudades:', error)
    }
  }

  // Cargar datos de cajas
  const loadData = async () => {
    if (loadingRef) return
    
    // Check cache first
    const cached = localStorage.getItem('cajas_compensacion_cache')
    if (cached && !dataLoaded) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 300000) { // 5min cache
        setCajas(parsed.data)
        setDataLoaded(true)
        setLoading(false)
        return
      }
      localStorage.removeItem('cajas_compensacion_cache')
    }
    
    setLoadingRef(true)
    setLoading(true)
    
    try {
      // Cargar cajas con información de ciudad
      const { data, error } = await supabase
        .from('cajas_compensacion')
        .select(`
          *,
          ciudades (
            nombre
          )
        `)
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error loading cajas:', error)
        showToast('Error al cargar las cajas de compensación', 'error')
        return
      }

      // Transformar datos para incluir nombre de ciudad
      const cajasData = (data || []).map(caja => ({
        ...caja,
        ciudad_nombre: caja.ciudades?.nombre || 'Sin ciudad'
      }))
      
      // Save to cache
      localStorage.setItem('cajas_compensacion_cache', JSON.stringify({
        data: cajasData,
        timestamp: Date.now()
      }))
      
      setCajas(cajasData)
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading cajas:', error)
      showToast('Error al cargar las cajas de compensación', 'error')
    } finally {
      setLoading(false)
      setLoadingRef(false)
    }
  }

  useEffect(() => {
    const shouldLoad = !permissionsLoading && permissions.length > 0 && canView && !dataLoaded && !loadingRef
    if (shouldLoad) {
      // Cargar ciudades primero, luego cajas
      loadCiudades().then(() => {
        loadData()
      })
    } else if (dataLoaded) {
      setLoading(false)
    }
  }, [permissionsLoading, permissions.length, canView, dataLoaded])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
  }

  // Crear caja
  const handleCreate = async (formData: any) => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id

    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('cajas_compensacion')
      .insert([{
        nombre: formData.nombre.trim(),
        ciudad_id: formData.ciudad_id,
        created_by: userId,
        updated_by: userId
      }])

    if (error) {
      console.error('Error creating caja:', error)
      throw new Error(error.message)
    }

    // Clear cache and reload
    localStorage.removeItem('cajas_compensacion_cache')
    await loadData()
    showToast('Caja de compensación creada exitosamente', 'success')
  }

  // Editar caja
  const handleEdit = async (formData: any) => {
    if (!selectedRecord) return

    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id

    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('cajas_compensacion')
      .update({
        nombre: formData.nombre.trim(),
        ciudad_id: formData.ciudad_id,
        updated_by: userId
      })
      .eq('id', selectedRecord.id)

    if (error) {
      console.error('Error updating caja:', error)
      throw new Error(error.message)
    }

    // Clear cache and reload
    localStorage.removeItem('cajas_compensacion_cache')
    await loadData()
    showToast('Caja de compensación actualizada exitosamente', 'success')
  }

  // Eliminar caja
  const handleDelete = async () => {
    if (!selectedRecord) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('cajas_compensacion')
        .delete()
        .eq('id', selectedRecord.id)

      if (error) {
        console.error('Error deleting caja:', error)
        throw new Error(error.message)
      }

      // Clear cache and reload
      localStorage.removeItem('cajas_compensacion_cache')
      await loadData()
      showToast('Caja de compensación eliminada exitosamente', 'success')
      setShowDeleteModal(false)
      setSelectedRecord(null)
    } catch (error: any) {
      console.error('Error deleting caja:', error)
      showToast(error.message || 'Error al eliminar la caja de compensación', 'error')
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
      key: 'ciudad_nombre',
      label: 'Ciudad',
      sortable: true,
      mobileShow: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <MapPin className="w-3 h-3 mr-1" />
          {value}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha Creación',
      sortable: true,
      mobileShow: false,
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
      onClick: (record: CajaCompensacion) => {
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
      onClick: (record: CajaCompensacion) => {
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
      label: 'Nombre de la Caja',
      type: 'text' as const,
      required: true,
      placeholder: 'Ej: Colsubsidio, Compensar, Cafam...'
    },
    {
      key: 'ciudad_id',
      label: 'Ciudad',
      type: 'select' as const,
      required: true,
      placeholder: 'Seleccionar ciudad...',
      options: ciudades.map(ciudad => ({
        value: ciudad.id,
        label: ciudad.nombre
      }))
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
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#004C4C]">Cajas de Compensación</h1>
              <p className="text-[#065C5C] text-sm">
                Gestiona las cajas de compensación familiar por ciudad
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <ResponsiveDataTable
        data={cajas}
        columns={columns}
        actions={actions}
        loading={loading}
        searchPlaceholder="Buscar cajas de compensación..."
        onAdd={canCreate ? () => setShowCreateModal(true) : undefined}
        canCreate={canCreate}
        emptyMessage="No hay cajas de compensación registradas"
        addButtonText="Agregar Caja"
        mobileTitle={(record) => record.nombre}
        mobileSubtitle={(record) => record.ciudad_nombre}
        mobileBadge={() => (
          <div className="flex items-center space-x-1">
            <Building className="w-3 h-3 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Caja</span>
          </div>
        )}
      />

      {/* Modal Crear */}
      <AuxiliaryTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
        title="Agregar Nueva Caja de Compensación"
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
        title="Editar Caja de Compensación"
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
        title="Eliminar Caja de Compensación"
        message="¿Estás seguro de que deseas eliminar esta caja de compensación?"
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
