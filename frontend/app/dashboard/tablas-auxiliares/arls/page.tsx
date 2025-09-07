/**
 * Página CRUD para gestión de ARLs
 * Permite crear, editar, eliminar y listar ARLs
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/usePermissions'
import { supabase } from '@/lib/supabaseClient'
import { Shield, ArrowLeft } from 'lucide-react'
import AuxiliaryDataTable from '@/components/ui/AuxiliaryDataTable'
import AuxiliaryTableModal from '@/components/ui/AuxiliaryTableModal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import Toast from '@/components/dashboard/Toast'

interface ARL {
  id: string
  nombre: string
  created_at: string
  updated_at: string
}

export default function ARLsPage() {
  const [arls, setArls] = useState<ARL[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRef, setLoadingRef] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ARL | null>(null)
  
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

  // Cargar datos
  const loadData = async () => {
    if (loadingRef) return
    
    // Check cache first
    const cached = localStorage.getItem('arls_cache')
    if (cached && !dataLoaded) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 300000) { // 5min cache
        setArls(parsed.data)
        setDataLoaded(true)
        setLoading(false)
        return
      }
      localStorage.removeItem('arls_cache')
    }
    
    setLoadingRef(true)
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('arls')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error loading arls:', error)
        showToast('Error al cargar las ARLs', 'error')
        return
      }

      const arlsData = data || []
      
      // Save to cache
      localStorage.setItem('arls_cache', JSON.stringify({
        data: arlsData,
        timestamp: Date.now()
      }))
      
      setArls(arlsData)
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading arls:', error)
      showToast('Error al cargar las ARLs', 'error')
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

  // Crear ARL
  const handleCreate = async (formData: any) => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id

    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('arls')
      .insert([{
        nombre: formData.nombre.trim(),
        created_by: userId,
        updated_by: userId
      }])

    if (error) {
      console.error('Error creating arl:', error)
      throw new Error(error.message)
    }

    // Clear cache and reload
    localStorage.removeItem('arls_cache')
    await loadData()
    showToast('ARL creada exitosamente', 'success')
  }

  // Editar ARL
  const handleEdit = async (formData: any) => {
    if (!selectedRecord) return

    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id

    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    const { error } = await supabase
      .from('arls')
      .update({
        nombre: formData.nombre.trim(),
        updated_by: userId
      })
      .eq('id', selectedRecord.id)

    if (error) {
      console.error('Error updating arl:', error)
      throw new Error(error.message)
    }

    // Clear cache and reload
    localStorage.removeItem('arls_cache')
    await loadData()
    showToast('ARL actualizada exitosamente', 'success')
  }

  // Eliminar ARL
  const handleDelete = async () => {
    if (!selectedRecord) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('arls')
        .delete()
        .eq('id', selectedRecord.id)

      if (error) {
        console.error('Error deleting arl:', error)
        throw new Error(error.message)
      }

      // Clear cache and reload
      localStorage.removeItem('arls_cache')
      await loadData()
      showToast('ARL eliminada exitosamente', 'success')
      setShowDeleteModal(false)
      setSelectedRecord(null)
    } catch (error: any) {
      console.error('Error deleting arl:', error)
      showToast(error.message || 'Error al eliminar la ARL', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Configuración de la tabla
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Fecha Creación',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-ES')
    }
  ]

  // Configuración del formulario
  const formFields = [
    {
      key: 'nombre',
      label: 'Nombre de la ARL',
      type: 'text' as const,
      required: true,
      placeholder: 'Ej: ARL SURA, Positiva, Colmena...'
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
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#004C4C]">ARLs</h1>
              <p className="text-[#065C5C] text-sm">
                Gestiona las Administradoras de Riesgos Laborales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <AuxiliaryDataTable
        data={arls}
        columns={columns}
        loading={loading}
        searchPlaceholder="Buscar ARLs..."
        onAdd={canCreate ? () => setShowCreateModal(true) : undefined}
        onEdit={canEdit ? (record) => {
          setSelectedRecord(record)
          setShowEditModal(true)
        } : undefined}
        onDelete={canDelete ? (record) => {
          setSelectedRecord(record)
          setShowDeleteModal(true)
        } : undefined}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        emptyMessage="No hay ARLs registradas"
        addButtonText="Agregar ARL"
      />

      {/* Modal Crear */}
      <AuxiliaryTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
        title="Agregar Nueva ARL"
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
        title="Editar ARL"
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
        title="Eliminar ARL"
        message="¿Estás seguro de que deseas eliminar esta ARL?"
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
