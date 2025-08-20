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
  FileText,
  CheckCircle,
  Trash2,
  Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { 
  Contract, 
  getContractStatusConfig, 
  getStatusAprobacionConfig, 
  getStatusVigenciaConfig 
} from '../../types/contract'
import { ContractStatusCompact } from '../ui/ContractStatusBadges'
import ContractApprovalButton from '../ui/ContractApprovalButton'
import DeleteContractModal from '../ui/DeleteContractModal'
import ReportNoveltyButton from '../ui/ReportNoveltyButton'

interface ContractsTableProps {
  contracts: Contract[]
  onEdit: (contract: Contract) => void
  onUpdate: () => void
  canUpdate: boolean
  canDelete: boolean
  onApprove?: (contract: Contract) => void
  onReportNovelty?: (contract: Contract) => void
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
  canDelete,
  onApprove,
  onReportNovelty
}: ContractsTableProps) {
  const [loadingInline, setLoadingInline] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)

  // Formatear fechas
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Formatear moneda con puntos como separadores
  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(/,/g, '.')
  }

  // Generar grid columns dinámicamente
  const generateGridColumns = () => {
    const baseColumns = [
      '100px', // Acciones
      '200px', // Empleado  
      '140px', // Empresa
      '130px', // Contrato
      '110px', // F. Ingreso
      '110px'  // F. Terminación
    ]
    
    // Agregar columnas dinámicas para onboarding (85px cada una)
    const onboardingColumns = onboardingFields.map(() => '85px')
    
    const finalColumns = [
      ...baseColumns,
      ...onboardingColumns,
      '90px' // Progreso
    ]
    
    return finalColumns.join(' ')
  }

  // Calcular ancho mínimo dinámicamente
  const calculateMinWidth = () => {
    const baseWidth = 100 + 200 + 140 + 130 + 110 + 110 + 90 // Columnas fijas: 880px
    const onboardingWidth = onboardingFields.length * 85 // Columnas dinámicas
    const gaps = (6 + onboardingFields.length) * 8 // 8px gap entre columnas
    return baseWidth + onboardingWidth + gaps + 50 // +50px margen de seguridad
  }



  // Toggle inline de campos de onboarding
  const handleToggleOnboarding = async (contractId: string, field: OnboardingField, currentValue: boolean) => {
    if (!canUpdate) return

    // Buscar el contrato para verificar si se puede editar
    const contract = contracts.find(c => c.id === contractId)
    if (!contract || !getContractStatusConfig(contract).can_edit) {
      console.warn('No se puede editar este contrato - está aprobado')
      return
    }

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

  // Debug: Log para verificar sticky
  console.log('ContractsTable rendered - Debug sticky')
  
  const onboardingFields = [
    { key: 'programacion_cita_examenes' as OnboardingField, label: 'Prog Cita' },
    { key: 'examenes' as OnboardingField, label: 'Exámenes' },
    { key: 'solicitud_inscripcion_arl' as OnboardingField, label: 'Sol ARL' },
    { key: 'inscripcion_arl' as OnboardingField, label: 'ARL' },
    { key: 'envio_contrato' as OnboardingField, label: 'Envío' },
    { key: 'recibido_contrato_firmado' as OnboardingField, label: 'Firmado' },
    { key: 'solicitud_eps' as OnboardingField, label: 'Sol EPS' },
    { key: 'confirmacion_eps' as OnboardingField, label: 'EPS' },
    { key: 'envio_inscripcion_caja' as OnboardingField, label: 'Env Caja' },
    { key: 'confirmacion_inscripcion_caja' as OnboardingField, label: 'Caja' },
    { key: 'radicado_eps' as OnboardingField, label: 'Rad EPS' },
    { key: 'radicado_ccf' as OnboardingField, label: 'Rad CCF' }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Tabla con scroll unificado */}
      <div className="hidden lg:block overflow-y-auto max-h-screen">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${calculateMinWidth()}px` }}>
            
            {/* Header de tabla */}
            <div 
              className="grid gap-2 p-4 bg-red-100 border-b border-gray-200 font-medium text-gray-700 text-sm sticky top-0 z-10" 
              style={{
                gridTemplateColumns: generateGridColumns(),
                backgroundColor: 'red', // Debug color
                position: 'sticky',
                top: '0px',
                zIndex: '50'
              }}
            >
            
            {/* Acciones al principio */}
            <div>Acciones</div>
            
            {/* Campos principales */}
            <div>Empleado</div>
            <div>Empresa</div>
            <div>Contrato</div>
            <div>F. Ingreso</div>
            <div>F. Terminación</div>
            
            {/* Todos los campos de onboarding (12 campos) con labels escritos */}
            {onboardingFields.map(field => (
              <div key={field.key} className="text-center text-xs">
                <div className="break-words leading-tight font-medium">{field.label}</div>
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
                  <div className={`grid gap-2 p-3 hover:bg-gray-50 transition-colors`} style={{gridTemplateColumns: generateGridColumns()}}>
                    
                    {/* Acciones al principio */}
                    <div className="flex flex-col items-start space-y-1">
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
                        {getContractStatusConfig(contract).can_edit ? (
                          canUpdate && (
                            <button
                              onClick={() => onEdit(contract)}
                              className="p-1 text-[#004C4C] hover:text-[#065C5C] transition-colors"
                              title="Editar contrato"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => onEdit(contract)}
                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Ver contrato (solo lectura)"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && getContractStatusConfig(contract).can_delete && (
                          <button
                            onClick={() => setContractToDelete(contract)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar contrato"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Botón de aprobación */}
                      {getContractStatusConfig(contract).can_approve && onApprove && (
                        <ContractApprovalButton 
                          contract={contract} 
                          onSuccess={() => onApprove(contract)}
                          className="text-xs px-2 py-1"
                        />
                      )}
                      
                      {/* Botón de reportar novedad */}
                      {!getContractStatusConfig(contract).can_approve && contract.status_aprobacion === 'aprobado' && onReportNovelty && (
                        <ReportNoveltyButton 
                          contract={contract} 
                          onReport={onReportNovelty}
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Empleado */}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{fullName}</div>
                      <div className="text-xs text-gray-500 mb-1">{contract.tipo_identificacion} {contract.numero_identificacion}</div>
                      <ContractStatusCompact contract={contract} />
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
                      <div className="text-xs text-gray-500 mt-1 break-words leading-tight">
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

                    {/* Fecha terminación */}
                    <div className="text-sm">
                      {contract.fecha_fin ? (
                        <span className="text-orange-600 font-medium">
                          {formatDate(contract.fecha_fin)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Indefinido</span>
                      )}
                    </div>

                    {/* Todos los campos de onboarding (12 campos) */}
                    {onboardingFields.map(field => {
                      const isLoading = loadingInline.has(contract.id)
                      const value = contract[field.key]
                      const statusConfig = getContractStatusConfig(contract)
                      const canEditField = canUpdate && statusConfig.can_edit
                      
                      return (
                        <div key={field.key} className="flex justify-center">
                          <button
                            onClick={() => handleToggleOnboarding(contract.id, field.key, value)}
                            disabled={!canEditField || isLoading}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                              value 
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            } ${!canEditField ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={`${field.label}: ${value ? 'Completado' : 'Pendiente'} ${!statusConfig.can_edit ? '(Solo lectura)' : ''}`}
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

                  {/* Fila expandida - SOLO INFORMATIVA (no editable) */}
              {isExpanded && (
                <div className="hidden lg:block bg-gray-50 px-4 py-4 border-t border-gray-200">
                  
                  {/* Primera fila: 4 columnas COMPACTAS */}
                  <div className="flex gap-4 text-sm mb-6 max-w-5xl">
                    
                    {/* Información Personal */}
                    <div className="h-full w-64">
                      <div className="font-semibold text-gray-800 mb-3 text-base h-6">Información Personal</div>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Email:</span>
                          <span className="text-gray-800">{contract.email || 'No registrado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Teléfono:</span>
                          <span className="text-gray-800">{contract.celular || 'No registrado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">F. Nacimiento:</span>
                          <span className="text-gray-800">{formatDate(contract.fecha_nacimiento)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Género:</span>
                          <span className="text-gray-800">{contract.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Información Contractual */}
                    <div className="h-full w-56">
                      <div className="font-semibold text-gray-800 mb-3 text-base h-6">Información Contractual</div>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Tipo Contrato:</span>
                          <span className="text-gray-800">{contract.tipo_contrato || 'No especificado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Ciudad Labora:</span>
                          <span className="text-gray-800">{contract.ciudad_labora || 'No especificado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Tipo Salario:</span>
                          <span className="text-gray-800">{contract.tipo_salario || 'No especificado'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Aporta SENA:</span>
                          <span className="text-gray-800">{contract.base_sena ? 'Sí' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compensación */}
                    <div className="h-full w-52">
                      <div className="font-semibold text-gray-800 mb-3 text-base h-6">Compensación</div>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Salario Base:</span>
                          <span className="text-gray-800 font-medium">{formatCurrency(contract.salario)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Auxilio Salarial:</span>
                          <span className="text-gray-800">{formatCurrency(contract.auxilio_salarial)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Concepto Aux. Salarial:</span>
                          <span className="text-gray-800">{contract.auxilio_salarial_concepto || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Auxilios No Salariales */}
                    <div className="h-full w-48">
                      <div className="font-semibold text-gray-800 mb-3 text-base h-6">Auxilios No Salariales</div>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Auxilio No Salarial:</span>
                          <span className="text-gray-800">{formatCurrency(contract.auxilio_no_salarial)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Concepto Aux. No Salarial:</span>
                          <span className="text-gray-800">{contract.auxilio_no_salarial_concepto || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Segunda fila: 2 columnas COMPACTAS */}
                  <div className="flex gap-4 text-sm max-w-5xl">
                    
                    {/* Beneficiarios */}
                    <div className="w-64">
                      <div className="font-semibold text-gray-800 mb-3 text-base h-6">Beneficiarios</div>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Hijos:</span>
                          <span className="text-gray-800">{contract.beneficiario_hijo}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Madre:</span>
                          <span className="text-gray-800">{contract.beneficiario_madre === 1 ? 'Sí' : 'No'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Padre:</span>
                          <span className="text-gray-800">{contract.beneficiario_padre === 1 ? 'Sí' : 'No'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Cónyuge:</span>
                          <span className="text-gray-800">{contract.beneficiario_conyuge === 1 ? 'Sí' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Documentos y Observaciones - Expandido */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-3 text-base h-6">Documentos</div>
                      <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">URL Dropbox:</span>
                          {contract.dropbox ? (
                            <a 
                              href={contract.dropbox} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#004C4C] hover:text-[#065C5C] text-sm underline break-all"
                            >
                              Ver documentos
                            </a>
                          ) : (
                            <span className="text-gray-800">No registrado</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs font-medium">Observaciones:</span>
                          <span className="text-gray-800 text-sm leading-relaxed">
                            {contract.observacion || 'Sin observaciones'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Nota informativa */}
                  <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500 italic">
                      Para editar esta información, usa el botón "Editar" y abre el modal completo
                    </p>
                  </div>
                </div>
              )}

                </div>
              )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Vista móvil */}
      <div className="lg:hidden divide-y divide-gray-100">
        {contracts.map((contract) => {
          const statusConfig = getContractStatusConfig(contract)
          const fullName = contract.contracts_full_name || 
            `${contract.primer_nombre} ${contract.primer_apellido}`

          return (
            <div key={contract.id} className="p-4 space-y-3">
              {/* Info básica */}
              <div className="space-y-2">
                <div className="font-medium text-gray-900 text-lg">{fullName}</div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    contract.empresa_interna === 'Good' 
                      ? 'bg-[#87E0E0] text-[#004C4C]' 
                      : 'bg-[#5FD3D2] text-[#004C4C]'
                  }`}>
                    {contract.empresa_interna}
                  </span>
                  <span className="text-gray-600">
                    {contract.company?.name || 'Sin empresa cliente'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {contract.ciudad_labora && `${contract.ciudad_labora} • `}
                  {contract.cargo || 'Sin cargo definido'}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center space-x-2">
                <ContractStatusCompact contract={contract} />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex space-x-2">
                  {/* Botón de editar/ver */}
                  {statusConfig.can_edit ? (
                    canUpdate && (
                      <button
                        onClick={() => onEdit(contract)}
                        className="flex items-center space-x-1 px-3 py-2 bg-[#004C4C] text-white rounded-lg text-sm font-medium hover:bg-[#065C5C] transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onEdit(contract)}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver</span>
                    </button>
                  )}
                  
                  {/* Botón de aprobar */}
                  {statusConfig.can_approve && onApprove && (
                    <ContractApprovalButton 
                      contract={contract}
                      onApprove={onApprove}
                      size="sm"
                    />
                  )}
                  
                  {/* Botón de reportar novedad */}
                  {!statusConfig.can_approve && contract.status_aprobacion === 'aprobado' && onReportNovelty && (
                    <ReportNoveltyButton 
                      contract={contract} 
                      onReport={onReportNovelty}
                      size="sm"
                    />
                  )}
                  
                  {/* Botón de eliminar */}
                  {canDelete && statusConfig.can_delete && (
                    <button
                      onClick={() => setContractToDelete(contract)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
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

      {/* Modal de Eliminación */}
      <DeleteContractModal
        isOpen={!!contractToDelete}
        onClose={() => setContractToDelete(null)}
        onSuccess={() => {
          setContractToDelete(null)
          onUpdate()
        }}
        contract={contractToDelete}
      />
    </div>
  )
}
