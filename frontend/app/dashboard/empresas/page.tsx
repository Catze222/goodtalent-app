'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Search, Filter, Archive, RefreshCw } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { usePermissions } from '../../../lib/usePermissions'
import CompanyModal from '../../../components/dashboard/CompanyModal'
import CompanyCard from '../../../components/dashboard/CompanyCard'

interface Company {
  id: string
  name: string
  tax_id: string
  accounts_contact_name: string
  accounts_contact_email: string
  accounts_contact_phone: string
  status: boolean
  created_at: string
  updated_at: string
  archived_at?: string | null
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'archived'

/**
 * Página principal del módulo Empresas
 * Gestión completa de empresas clientes con CRUD y filtros
 */
export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const { hasPermission, loading: permissionsLoading } = usePermissions()
  
  // Verificar permisos
  const canRead = hasPermission('companies', 'view')
  const canCreate = hasPermission('companies', 'create')
  const canUpdate = hasPermission('companies', 'edit')
  const canDelete = hasPermission('companies', 'delete')

  // Cargar empresas solo cuando los permisos estén listos
  const loadCompanies = async () => {
    if (permissionsLoading) {
      return // Esperar a que los permisos carguen
    }
    
    if (!canRead) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Solo cargar empresas cuando los permisos estén completamente cargados
    if (!permissionsLoading) {
      loadCompanies()
    }
  }, [canRead, permissionsLoading])

  // Filtrar empresas
  const filteredCompanies = companies.filter(company => {
    // Filtro por texto
    const matchesSearch = searchTerm === '' || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.tax_id.includes(searchTerm) ||
      company.accounts_contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.accounts_contact_email.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro por estado
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && company.status && !company.archived_at) ||
      (filterStatus === 'inactive' && !company.status && !company.archived_at) ||
      (filterStatus === 'archived' && company.archived_at)

    return matchesSearch && matchesFilter
  })

  const handleCreateNew = () => {
    if (!canCreate) return
    setEditingCompany(null)
    setModalMode('create')
    setShowModal(true)
  }

  const handleEdit = (company: Company) => {
    if (!canUpdate) return
    setEditingCompany(company)
    setModalMode('edit')
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingCompany(null)
  }

  const handleModalSuccess = () => {
    loadCompanies()
  }

  // Mostrar loading mientras los permisos cargan
  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-4 border-[#87E0E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Sin Permisos</h2>
          <p className="text-red-600">
            No tienes permisos para acceder al módulo de empresas.
            Contacta al administrador para solicitar acceso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-[#87E0E0]" />
            <span>Empresas</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de empresas clientes y configuraciones corporativas
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Total: {companies.length}</span>
            <span>Activas: {companies.filter(c => c.status && !c.archived_at).length}</span>
            <span>Archivadas: {companies.filter(c => c.archived_at).length}</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadCompanies}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          
          {canCreate && (
            <button 
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#065C5C] hover:to-[#0A6A6A] transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nueva Empresa</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, NIT, contacto o email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="archived">Archivadas</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredCompanies.length} de {companies.length} empresas
          </div>
        )}
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-4 border-[#87E0E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas...</p>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onEdit={handleEdit}
              onUpdate={loadCompanies}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : companies.length === 0 ? (
        /* Empty state - No companies */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#87E0E0] to-[#5FD3D2] rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-[#004C4C]" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Comienza agregando empresas!
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            No hay empresas registradas aún. Crea la primera empresa para comenzar a gestionar 
            clientes y configuraciones corporativas.
          </p>
          
          {canCreate && (
            <button 
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#065C5C] hover:to-[#0A6A6A] transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Crear Primera Empresa</span>
            </button>
          )}
        </div>
      ) : (
        /* No results for search */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sin resultados</h3>
          <p className="text-gray-600 mb-4">
            No se encontraron empresas que coincidan con tu búsqueda "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-[#004C4C] hover:text-[#065C5C] font-medium"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Company Modal */}
      <CompanyModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        company={editingCompany}
        mode={modalMode}
      />
    </div>
  )
}
