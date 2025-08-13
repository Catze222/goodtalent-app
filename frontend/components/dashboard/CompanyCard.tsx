'use client'

import { useState } from 'react'
import { Edit3, Archive, RotateCcw, Mail, Phone, User, Calendar, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

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
  created_by?: string
  updated_by?: string
  archived_at?: string | null
  archived_by?: string | null
}

interface CompanyCardProps {
  company: Company
  onEdit: (company: Company) => void
  onUpdate: () => void
  canUpdate: boolean
  canDelete: boolean
}

/**
 * Tarjeta moderna para mostrar información de empresas
 * Incluye acciones de editar, activar/desactivar y archivar
 */
export default function CompanyCard({
  company,
  onEdit,
  onUpdate,
  canUpdate,
  canDelete
}: CompanyCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const isArchived = !!company.archived_at

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStatusToggle = async () => {
    if (!canUpdate) return
    
    setLoading('status')
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { error } = await supabase
        .from('companies')
        .update({ 
          status: !company.status,
          updated_by: user.id
        })
        .eq('id', company.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleArchive = async () => {
    if (!canDelete) return
    
    setLoading('archive')
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { error } = await supabase
        .from('companies')
        .update({ 
          archived_at: new Date().toISOString(),
          status: false,
          archived_by: user.id,
          updated_by: user.id
        })
        .eq('id', company.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error archiving company:', error)
    } finally {
      setLoading(null)
      setShowConfirm(null)
    }
  }

  const handleUnarchive = async () => {
    if (!canUpdate) return
    
    setLoading('unarchive')
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { error } = await supabase
        .from('companies')
        .update({ 
          archived_at: null,
          archived_by: null,
          status: true,
          updated_by: user.id
        })
        .eq('id', company.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error unarchiving company:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden`}>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {isArchived ? (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              Archivada
            </span>
          ) : company.status ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Activa
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
              Inactiva
            </span>
          )}
        </div>

        {/* Company Header - banda a todo el ancho de la tarjeta */}
        <div className="mb-4">
          <div className="-mx-6 -mt-6 rounded-t-2xl bg-[#F1F5F9] border-b border-gray-200 px-6 py-3 sm:py-4 pr-20">
            <h3 className="text-sm sm:text-base md:text-lg leading-tight font-bold text-[#004C4C] truncate">
              {company.name}
            </h3>
          </div>
          <p className="mt-2 text-xs text-gray-500 pr-16">NIT: {company.tax_id}</p>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700 font-medium">{company.accounts_contact_name}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <a 
              href={`mailto:${company.accounts_contact_email}`}
              className="text-[#004C4C] hover:text-[#065C5C] transition-colors truncate"
            >
              {company.accounts_contact_email}
            </a>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <a 
              href={`tel:${company.accounts_contact_phone}`}
              className="text-[#004C4C] hover:text-[#065C5C] transition-colors"
            >
              {company.accounts_contact_phone}
            </a>
          </div>
        </div>

        {/* Metadata (altura consistente y usuarios creador/editor) */}
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="flex flex-col space-y-1 text-xs text-gray-500 min-h-[44px]">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <span>Creada: {formatDate(company.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <span>
                Actualizada: {company.updated_at !== company.created_at ? formatDate(company.updated_at) : '—'}
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-500">
            <div>
              <span className="font-medium">Creado por: </span>
              <span title={company.companies_created_by_handle || ''}>{company.companies_created_by_handle ?? 'N/D'}</span>
            </div>
            <div>
              <span className="font-medium">Editado por: </span>
              <span title={company.companies_updated_by_handle || ''}>{company.companies_updated_by_handle ?? 'N/D'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Editar */}
          {canUpdate && !isArchived && (
            <button
              onClick={() => onEdit(company)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <Edit3 className="h-4 w-4" />
              <span>Editar</span>
            </button>
          )}

          {/* Toggle Status */}
          {canUpdate && !isArchived && (
            <button
              onClick={handleStatusToggle}
              disabled={loading === 'status'}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                company.status
                  ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {loading === 'status' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              <span>{company.status ? 'Desactivar' : 'Activar'}</span>
            </button>
          )}

          {/* Archivar */}
          {canDelete && !isArchived && (
            <button
              onClick={() => setShowConfirm('archive')}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              <Archive className="h-4 w-4" />
              <span>Archivar</span>
            </button>
          )}

          {/* Desarchivar */}
          {canUpdate && isArchived && (
            <button
              onClick={handleUnarchive}
              disabled={loading === 'unarchive'}
              className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
            >
              {loading === 'unarchive' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              <span>Restaurar</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm === 'archive' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmar Archivado</h3>
                <p className="text-sm text-gray-600">Esta acción no se puede deshacer fácilmente</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas archivar la empresa <strong>{company.name}</strong>?
              La empresa se marcará como archivada y se desactivará automáticamente.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={loading === 'archive'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading === 'archive' ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Archivando...</span>
                  </div>
                ) : (
                  'Archivar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
