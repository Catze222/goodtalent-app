'use client'

import { useState } from 'react'
import { 
  Check, 
  X, 
  Edit, 
  Loader2, 
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2,
  User,
  FileText
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface Contract {
  id: string
  primer_nombre: string
  segundo_nombre?: string | null
  primer_apellido: string
  segundo_apellido?: string | null
  tipo_identificacion: string
  numero_identificacion: string
  fecha_nacimiento: string
  genero: string
  celular?: string | null
  email?: string | null
  empresa_interna: string
  empresa_final_id: string
  ciudad_labora?: string | null
  cargo?: string | null
  numero_contrato_helisa: string
  base_sena: boolean
  fecha_ingreso?: string | null
  tipo_contrato?: string | null
  fecha_fin?: string | null
  tipo_salario?: string | null
  salario?: number | null
  auxilio_salarial?: number | null
  auxilio_salarial_concepto?: string | null
  auxilio_no_salarial?: number | null
  auxilio_no_salarial_concepto?: string | null
  beneficiario_hijo: number
  beneficiario_madre: number
  beneficiario_padre: number
  beneficiario_conyuge: number
  fecha_solicitud?: string | null
  fecha_radicado?: string | null
  programacion_cita_examenes: boolean
  examenes: boolean
  solicitud_inscripcion_arl: boolean
  inscripcion_arl: boolean
  envio_contrato: boolean
  recibido_contrato_firmado: boolean
  solicitud_eps: boolean
  confirmacion_eps: boolean
  envio_inscripcion_caja: boolean
  confirmacion_inscripcion_caja: boolean
  dropbox?: string | null
  radicado_eps: boolean
  radicado_ccf: boolean
  observacion?: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  contracts_created_by_handle?: string | null
  contracts_updated_by_handle?: string | null
  contracts_full_name?: string | null
  contracts_onboarding_progress?: number | null
  company?: {
    name: string
    tax_id: string
  }
}

interface ContractsTableProps {
  contracts: Contract[]
  onEdit: (contract: Contract) => void
  onUpdate: () => void
  canUpdate: boolean
  canDelete: boolean
}

type OnboardingField = 
  | 'programacion_cita_examenes' 
  | 'examenes' 
  | 'solicitud_inscripcion_arl' 
  | 'inscripcion_arl' 
  | 'envio_contrato' 
  | 'recibido_contrato_firmado' 
  | 'solicitud_eps' 
  | 'confirmacion_eps' 
  | 'envio_inscripcion_caja' 
  | 'confirmacion_inscripcion_caja' 
  | 'radicado_eps' 
  | 'radicado_ccf'

/**
 * Tabla moderna de contratos con scroll unificado y edición inline
 * Optimizada para productividad con acciones al inicio y todos los campos editables
 */
export default function ContractsTable({ 
  contracts, 
  onEdit, 
  onUpdate, 
  canUpdate, 
  canDelete 
}: ContractsTableProps) {
  const [loadingInline, setLoadingInline] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Formatear fechas
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Formatear moneda
  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount)
  }



  // Toggle inline de campos de onboarding
  const handleToggleOnboarding = async (contractId: string, field: OnboardingField, currentValue: boolean) => {
    if (!canUpdate) return

    const newLoadingInline = new Set(loadingInline)
    newLoadingInline.add(contractId)
    setLoadingInline(newLoadingInline)

    try {
      const { error } = await supabase
        .from('contracts')
        .update({ [field]: !currentValue })
        .eq('id', contractId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error updating onboarding field:', error)
    } finally {
      const newLoadingInline = new Set(loadingInline)
      newLoadingInline.delete(contractId)
      setLoadingInline(newLoadingInline)
    }
  }



  // Actualizar campo individual
  const handleFieldUpdate = async (contractId: string, fieldName: string, value: any) => {
    if (!canUpdate) return

    try {
      const { error } = await supabase
        .from('contracts')
        .update({ [fieldName]: value })
        .eq('id', contractId)

      if (error) throw error
      onUpdate() // Refrescar datos
    } catch (error) {
      console.error('Error updating field:', error)
    }
  }

  // Toggle expandir fila
  const toggleRowExpansion = (contractId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId)
    } else {
      newExpanded.add(contractId)
    }
    setExpandedRows(newExpanded)
  }

  // Calcular progreso visual
  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-green-400'
    if (progress >= 50) return 'bg-yellow-400'
    if (progress >= 25) return 'bg-orange-400'
    return 'bg-red-400'
  }

  const onboardingFields = [
    { key: 'programacion_cita_examenes' as OnboardingField, label: 'Prog. Cita', icon: '📅' },
    { key: 'examenes' as OnboardingField, label: 'Exámenes', icon: '🩺' },
    { key: 'solicitud_inscripcion_arl' as OnboardingField, label: 'Sol. ARL', icon: '📝' },
    { key: 'inscripcion_arl' as OnboardingField, label: 'ARL', icon: '🛡️' },
    { key: 'envio_contrato' as OnboardingField, label: 'Envío', icon: '📤' },
    { key: 'recibido_contrato_firmado' as OnboardingField, label: 'Firmado', icon: '✍️' },
    { key: 'solicitud_eps' as OnboardingField, label: 'Sol. EPS', icon: '📋' },
    { key: 'confirmacion_eps' as OnboardingField, label: 'EPS', icon: '💊' },
    { key: 'envio_inscripcion_caja' as OnboardingField, label: 'Envío Caja', icon: '📦' },
    { key: 'confirmacion_inscripcion_caja' as OnboardingField, label: 'Caja', icon: '✅' },
    { key: 'radicado_eps' as OnboardingField, label: 'Rad. EPS', icon: '📄' },
    { key: 'radicado_ccf' as OnboardingField, label: 'Rad. CCF', icon: '📊' }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Tabla con scroll unificado */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-[1500px]">
          
          {/* Header de tabla */}
          <div className="grid gap-2 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm" style={{gridTemplateColumns: '100px 180px 120px 120px 100px repeat(12, 80px) 80px'}}>
            
            {/* Acciones al principio */}
            <div>Acciones</div>
            
            {/* Campos principales */}
            <div>Empleado</div>
            <div>Empresa</div>
            <div>Contrato</div>
            <div>F. Ingreso</div>
            
            {/* Todos los campos de onboarding (12 campos) */}
            {onboardingFields.map(field => (
              <div key={field.key} className="text-center text-xs">
                <div className="mb-1">{field.icon}</div>
                <div className="break-words leading-tight">{field.label}</div>
              </div>
            ))}
            
            {/* Progreso */}
            <div>Progreso</div>
          </div>

          {/* Filas de la tabla dentro del mismo contenedor */}
          <div className="divide-y divide-gray-100">
            {contracts.map((contract) => {
              const isExpanded = expandedRows.has(contract.id)
              const progress = contract.contracts_onboarding_progress || 0
              const fullName = contract.contracts_full_name || 
                `${contract.primer_nombre} ${contract.primer_apellido}`

              return (
                <div key={contract.id}>
                  {/* Fila principal - Dentro del scroll unificado */}
                  <div className={`grid gap-2 p-3 hover:bg-gray-50 transition-colors`} style={{gridTemplateColumns: '100px 180px 120px 120px 100px repeat(12, 80px) 80px'}}>
                    
                    {/* Acciones al principio */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleRowExpansion(contract.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver detalles"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {canUpdate && (
                        <button
                          onClick={() => onEdit(contract)}
                          className="p-1 text-[#004C4C] hover:text-[#065C5C] transition-colors"
                          title="Editar contrato"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Empleado */}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{fullName}</div>
                      <div className="text-xs text-gray-500">{contract.numero_identificacion}</div>
                    </div>

                    {/* Empresa */}
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        contract.empresa_interna === 'Good' 
                          ? 'bg-[#87E0E0] text-[#004C4C]' 
                          : 'bg-[#5FD3D2] text-[#004C4C]'
                      }`}>
                        {contract.empresa_interna}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {contract.company?.name || 'Sin empresa'}
                      </div>
                    </div>

                    {/* Contrato */}
                    <div>
                      <div className="text-sm font-medium truncate">{contract.numero_contrato_helisa}</div>
                      <div className="text-xs text-gray-500">{contract.cargo || '-'}</div>
                    </div>

                    {/* Fecha ingreso */}
                    <div className="text-sm">
                      {formatDate(contract.fecha_ingreso)}
                    </div>

                    {/* Todos los campos de onboarding (12 campos) */}
                    {onboardingFields.map(field => {
                      const isLoading = loadingInline.has(contract.id)
                      const value = contract[field.key]
                      
                      return (
                        <div key={field.key} className="flex justify-center">
                          <button
                            onClick={() => handleToggleOnboarding(contract.id, field.key, value)}
                            disabled={!canUpdate || isLoading}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                              value 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={`${field.label}: ${value ? 'Completado' : 'Pendiente'}`}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : value ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )
                    })}

                    {/* Progreso */}
                    <div>
                      <div className="flex items-center space-x-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fila expandida con campos editables inline */}
              {isExpanded && (
                <div className="hidden lg:block bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    
                    {/* Información Personal - Editables */}
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Información Personal</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">📧</span>
                          <input
                            type="email"
                            defaultValue={contract.email || ''}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'email', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            placeholder="Email"
                            disabled={!canUpdate}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">📱</span>
                          <input
                            type="tel"
                            defaultValue={contract.celular || ''}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'celular', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            placeholder="Teléfono"
                            disabled={!canUpdate}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">📅</span>
                          <input
                            type="date"
                            defaultValue={contract.fecha_nacimiento}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'fecha_nacimiento', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            disabled={!canUpdate}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contrato - Editables */}
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Contrato</div>
                      <div className="space-y-2">
                        <select
                          defaultValue={contract.tipo_contrato || ''}
                          onChange={(e) => handleFieldUpdate(contract.id, 'tipo_contrato', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                          disabled={!canUpdate}
                        >
                          <option value="">Tipo contrato</option>
                          <option value="Indefinido">Indefinido</option>
                          <option value="Fijo">Fijo</option>
                          <option value="Obra">Obra</option>
                          <option value="Aprendizaje">Aprendizaje</option>
                        </select>
                        <input
                          type="number"
                          defaultValue={contract.salario || ''}
                          onBlur={(e) => handleFieldUpdate(contract.id, 'salario', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                          placeholder="Salario"
                          disabled={!canUpdate}
                        />
                        <input
                          type="text"
                          defaultValue={contract.ciudad_labora || ''}
                          onBlur={(e) => handleFieldUpdate(contract.id, 'ciudad_labora', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                          placeholder="Ciudad"
                          disabled={!canUpdate}
                        />
                      </div>
                    </div>

                    {/* Fechas - Editables */}
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Fechas</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-12">Sol:</span>
                          <input
                            type="date"
                            defaultValue={contract.fecha_solicitud || ''}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'fecha_solicitud', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            disabled={!canUpdate}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-12">Rad:</span>
                          <input
                            type="date"
                            defaultValue={contract.fecha_radicado || ''}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'fecha_radicado', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            disabled={!canUpdate}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-12">Fin:</span>
                          <input
                            type="date"
                            defaultValue={contract.fecha_fin || ''}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'fecha_fin', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            disabled={!canUpdate}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Beneficiarios - Editables */}
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Beneficiarios</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">👶</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={contract.beneficiario_hijo}
                            onBlur={(e) => handleFieldUpdate(contract.id, 'beneficiario_hijo', parseInt(e.target.value) || 0)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent"
                            placeholder="Hijos"
                            disabled={!canUpdate}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">👩</span>
                          <input
                            type="checkbox"
                            defaultChecked={contract.beneficiario_madre === 1}
                            onChange={(e) => handleFieldUpdate(contract.id, 'beneficiario_madre', e.target.checked ? 1 : 0)}
                            className="w-4 h-4 text-[#004C4C] rounded focus:ring-[#87E0E0] border-gray-300"
                            disabled={!canUpdate}
                          />
                          <span className="text-xs text-gray-600">Madre</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">👨</span>
                          <input
                            type="checkbox"
                            defaultChecked={contract.beneficiario_padre === 1}
                            onChange={(e) => handleFieldUpdate(contract.id, 'beneficiario_padre', e.target.checked ? 1 : 0)}
                            className="w-4 h-4 text-[#004C4C] rounded focus:ring-[#87E0E0] border-gray-300"
                            disabled={!canUpdate}
                          />
                          <span className="text-xs text-gray-600">Padre</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs w-8">💑</span>
                          <input
                            type="checkbox"
                            defaultChecked={contract.beneficiario_conyuge === 1}
                            onChange={(e) => handleFieldUpdate(contract.id, 'beneficiario_conyuge', e.target.checked ? 1 : 0)}
                            className="w-4 h-4 text-[#004C4C] rounded focus:ring-[#87E0E0] border-gray-300"
                            disabled={!canUpdate}
                          />
                          <span className="text-xs text-gray-600">Cónyuge</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Observaciones - Editable */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="font-medium text-gray-700 mb-2">Observaciones:</div>
                    <textarea
                      defaultValue={contract.observacion || ''}
                      onBlur={(e) => handleFieldUpdate(contract.id, 'observacion', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#87E0E0] focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Observaciones generales..."
                      disabled={!canUpdate}
                    />
                  </div>
                  </div>
                )}

                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Vista móvil */}
      <div className="lg:hidden divide-y divide-gray-100">
        {contracts.map((contract) => {
          const progress = contract.contracts_onboarding_progress || 0
          const fullName = contract.contracts_full_name || 
            `${contract.primer_nombre} ${contract.primer_apellido}`

          return (
            <div key={contract.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{fullName}</div>
                  <div className="text-sm text-gray-500">{contract.numero_contrato_helisa}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    contract.empresa_interna === 'Good' 
                      ? 'bg-[#87E0E0] text-[#004C4C]' 
                      : 'bg-[#5FD3D2] text-[#004C4C]'
                  }`}>
                    {contract.empresa_interna}
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Progress bar móvil */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Quick actions móvil */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {onboardingFields.slice(0, 4).map(field => {
                    const value = contract[field.key]
                    const isLoading = loadingInline.has(contract.id)
                    
                    return (
                      <button
                        key={field.key}
                        onClick={() => handleToggleOnboarding(contract.id, field.key, value)}
                        disabled={!canUpdate || isLoading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                          value 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        } disabled:opacity-50`}
                        title={field.label}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : value ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {canUpdate && (
                  <button
                    onClick={() => onEdit(contract)}
                    className="p-2 text-[#004C4C] hover:text-[#065C5C] transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {contracts.length === 0 && (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos</h3>
          <p className="text-gray-500">No se encontraron contratos que coincidan con los filtros.</p>
        </div>
      )}
    </div>
  )
}
