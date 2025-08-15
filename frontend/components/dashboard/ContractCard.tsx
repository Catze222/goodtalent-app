'use client'

import { useState } from 'react'
import { 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit,
  ExternalLink,
  Badge,
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

interface ContractCardProps {
  contract: Contract
  onEdit: (contract: Contract) => void
  onUpdate: () => void
  canUpdate: boolean
  canDelete: boolean
}

/**
 * Card moderno para mostrar información de contratos
 * Con progreso de onboarding, quick actions y diseño responsive
 */
export default function ContractCard({ 
  contract, 
  onEdit, 
  onUpdate, 
  canUpdate, 
  canDelete 
}: ContractCardProps) {
  const [updatingOnboarding, setUpdatingOnboarding] = useState(false)

  // Formatear fechas
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Formatear moneda
  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calcular estado del progreso
  const progress = contract.contracts_onboarding_progress || 0
  const getProgressColor = () => {
    if (progress === 100) return 'text-green-600'
    if (progress > 50) return 'text-yellow-600'
    if (progress > 0) return 'text-blue-600'
    return 'text-gray-400'
  }

  const getProgressBg = () => {
    if (progress === 100) return 'from-green-100 to-green-50 border-green-200'
    if (progress > 50) return 'from-yellow-100 to-yellow-50 border-yellow-200'
    if (progress > 0) return 'from-blue-100 to-blue-50 border-blue-200'
    return 'from-gray-100 to-gray-50 border-gray-200'
  }

  // Nombre completo
  const fullName = contract.contracts_full_name || 
    `${contract.primer_nombre} ${contract.primer_apellido}`

  // Quick toggle para campos de onboarding más importantes
  const quickToggleField = async (fieldName: string, currentValue: boolean) => {
    if (!canUpdate || updatingOnboarding) return

    setUpdatingOnboarding(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ [fieldName]: !currentValue })
        .eq('id', contract.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error updating onboarding field:', error)
    } finally {
      setUpdatingOnboarding(false)
    }
  }

  return (
    <div className={`bg-gradient-to-br ${getProgressBg()} border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      
      {/* Header con progreso */}
      <div className="p-4 bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">
                {fullName}
              </h3>
              {contract.empresa_interna && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  contract.empresa_interna === 'Good' 
                    ? 'bg-[#87E0E0] text-[#004C4C]' 
                    : 'bg-[#5FD3D2] text-[#004C4C]'
                }`}>
                  {contract.empresa_interna}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Badge className="h-3 w-3" />
              <span>{contract.numero_contrato_helisa}</span>
            </div>
          </div>
          
          {/* Progress ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                className="stroke-gray-200"
                strokeWidth="2"
              />
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                className={progress === 100 ? 'stroke-green-500' : progress > 50 ? 'stroke-yellow-500' : progress > 0 ? 'stroke-blue-500' : 'stroke-gray-300'}
                strokeWidth="2"
                strokeDasharray={`${progress * 0.88}, 88`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${getProgressColor()}`}>
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Info básica */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-3 w-3" />
            <span>{contract.numero_identificacion}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{contract.company?.name || 'Sin empresa'}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(contract.fecha_ingreso)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="h-3 w-3" />
            <span>{formatCurrency(contract.salario)}</span>
          </div>
        </div>

        {contract.cargo && (
          <div className="mt-2 text-sm text-gray-700 font-medium">
            {contract.cargo}
          </div>
        )}
      </div>

      {/* Quick actions para onboarding */}
      {canUpdate && (
        <div className="px-4 py-3 bg-white bg-opacity-60 border-t border-white border-opacity-50">
          <div className="text-xs text-gray-600 mb-2 font-medium">Quick Actions:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickToggleField('examenes', contract.examenes)}
              disabled={updatingOnboarding}
              className={`flex items-center space-x-1 text-xs p-2 rounded-lg transition-colors ${
                contract.examenes
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${updatingOnboarding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {contract.examenes ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>Exámenes</span>
            </button>
            
            <button
              onClick={() => quickToggleField('inscripcion_arl', contract.inscripcion_arl)}
              disabled={updatingOnboarding}
              className={`flex items-center space-x-1 text-xs p-2 rounded-lg transition-colors ${
                contract.inscripcion_arl
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${updatingOnboarding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {contract.inscripcion_arl ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>ARL</span>
            </button>

            <button
              onClick={() => quickToggleField('confirmacion_eps', contract.confirmacion_eps)}
              disabled={updatingOnboarding}
              className={`flex items-center space-x-1 text-xs p-2 rounded-lg transition-colors ${
                contract.confirmacion_eps
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${updatingOnboarding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {contract.confirmacion_eps ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>EPS</span>
            </button>

            <button
              onClick={() => quickToggleField('recibido_contrato_firmado', contract.recibido_contrato_firmado)}
              disabled={updatingOnboarding}
              className={`flex items-center space-x-1 text-xs p-2 rounded-lg transition-colors ${
                contract.recibido_contrato_firmado
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${updatingOnboarding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {contract.recibido_contrato_firmado ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>Contrato</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer con acciones */}
      <div className="px-4 py-3 bg-white bg-opacity-80 border-t border-white border-opacity-50 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {contract.contracts_updated_by_handle && (
            <span>Por {contract.contracts_updated_by_handle}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {contract.dropbox && (
            <a
              href={contract.dropbox}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#004C4C] hover:text-[#065C5C] transition-colors"
              title="Ver documentos"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          
          {canUpdate && (
            <button
              onClick={() => onEdit(contract)}
              className="text-[#004C4C] hover:text-[#065C5C] transition-colors"
              title="Editar contrato"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Observaciones si existen */}
      {contract.observacion && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700 leading-relaxed">
              {contract.observacion}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
