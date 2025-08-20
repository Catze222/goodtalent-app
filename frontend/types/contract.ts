/**
 * Tipos compartidos para el sistema de contratos
 * Incluye los nuevos estados de aprobación y vigencia
 */

export type StatusAprobacion = 'borrador' | 'aprobado'
export type StatusVigencia = 'activo' | 'terminado'

export interface Contract {
  id?: string
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
  
  // Nuevos campos de estados
  status_aprobacion?: StatusAprobacion
  approved_at?: string | null
  approved_by?: string | null
  
  // Campos de auditoría
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  
  // Computed columns
  contracts_created_by_handle?: string | null
  contracts_updated_by_handle?: string | null
  contracts_full_name?: string | null
  contracts_onboarding_progress?: number | null
  
  // Relaciones
  company?: {
    name: string
    tax_id: string
  }
}

export interface ContractStatus {
  status_aprobacion: StatusAprobacion
  status_vigencia: StatusVigencia
  can_edit: boolean
  can_delete: boolean
  can_approve: boolean
  days_until_expiry: number | null
}

export interface Company {
  id: string
  name: string
  tax_id: string
}

// Helpers para el estado del contrato
export const getStatusVigencia = (fecha_fin?: string | null): StatusVigencia => {
  if (!fecha_fin) return 'activo' // Contratos indefinidos
  const finDate = new Date(fecha_fin)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Comparar solo fechas, no horas
  finDate.setHours(0, 0, 0, 0)
  
  return finDate <= today ? 'terminado' : 'activo'
}

export const getDaysUntilExpiry = (fecha_fin?: string | null): number | null => {
  if (!fecha_fin) return null // Contratos indefinidos
  const finDate = new Date(fecha_fin)
  const today = new Date()
  const diffTime = finDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const getContractStatusConfig = (contract: Contract) => {
  const status_vigencia = getStatusVigencia(contract.fecha_fin)
  const days_until_expiry = getDaysUntilExpiry(contract.fecha_fin)
  
  // Valor por defecto para contratos existentes sin status_aprobacion
  const status_aprobacion = contract.status_aprobacion || 'aprobado'
  
  return {
    status_aprobacion,
    status_vigencia,
    can_edit: status_aprobacion === 'borrador',
    can_delete: status_aprobacion === 'borrador',
    can_approve: status_aprobacion === 'borrador',
    days_until_expiry
  }
}

// Utilidades para UI
export const getStatusAprobacionConfig = (status?: StatusAprobacion) => {
  // Valor por defecto para contratos existentes
  const actualStatus = status || 'aprobado'
  
  switch (actualStatus) {
    case 'borrador':
      return {
        label: 'Borrador',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '📝'
      }
    case 'aprobado':
      return {
        label: 'Aprobado',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      }
    default:
      return {
        label: 'Aprobado',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      }
  }
}

export const getStatusVigenciaConfig = (status: StatusVigencia, daysUntilExpiry?: number | null) => {
  switch (status) {
    case 'activo':
      // Si expira en menos de 30 días, mostrar como advertencia
      if (daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        return {
          label: `Vence en ${daysUntilExpiry} días`,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '⚠️'
        }
      }
      return {
        label: 'Activo',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🟢'
      }
    case 'terminado':
      return {
        label: 'Terminado',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '🔴'
      }
  }
}
