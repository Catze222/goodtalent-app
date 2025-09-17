'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Save, AlertCircle, ArrowLeft, Calendar, Pause, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { usePermissions } from '@/lib/usePermissions'

/**
 * Modal para gestionar novedades de tiempo laboral
 * Maneja prórrogas, vacaciones y suspensiones
 */

interface NovedadTiempoLaboralModalProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  onSuccess: () => void
  contractId: string
  contractName: string
}

interface TiempoLaboralData {
  tipo_tiempo: 'prorroga' | 'vacaciones' | 'suspension'
  fecha_inicio: string
  fecha_fin: string
  motivo: string
  // Campos específicos por tipo
  nueva_fecha_fin: string // solo prórrogas
  dias: string // vacaciones/suspensiones
  programadas: boolean // solo vacaciones
  disfrutadas: boolean // solo vacaciones
}

const TIEMPO_LABORAL_TYPES = [
  {
    id: 'prorroga' as const,
    label: 'Prórroga de Contrato',
    description: 'Extender la duración del contrato',
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'vacaciones' as const,
    label: 'Vacaciones',
    description: 'Registro de períodos vacacionales',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'suspension' as const,
    label: 'Suspensión',
    description: 'Suspensión temporal del contrato',
    icon: Pause,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
]

export default function NovedadTiempoLaboralModal({
  isOpen,
  onClose,
  onBack,
  onSuccess,
  contractId,
  contractName
}: NovedadTiempoLaboralModalProps) {
  const { user } = usePermissions()
  const [selectedType, setSelectedType] = useState<typeof TIEMPO_LABORAL_TYPES[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [contractInfo, setContractInfo] = useState<{
    fecha_inicio: string | null
    fecha_fin: string | null
    tipo_contrato: string | null
    numero_contrato_helisa: string | null
  }>({ 
    fecha_inicio: null, 
    fecha_fin: null, 
    tipo_contrato: null,
    numero_contrato_helisa: null
  })

  // Estado del formulario
  const [formData, setFormData] = useState<TiempoLaboralData>({
    tipo_tiempo: 'prorroga',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    motivo: '',
    nueva_fecha_fin: '',
    dias: '',
    programadas: false,
    disfrutadas: false
  })

  // Cargar información del contrato cuando se abre el modal
  useEffect(() => {
    const loadContractInfo = async () => {
      if (!isOpen || !contractId) return

      try {
        const { data: contract } = await supabase
          .from('contracts')
          .select('fecha_ingreso, fecha_fin, tipo_contrato, numero_contrato_helisa')
          .eq('id', contractId)
          .single()

        if (contract) {
          console.log('Contract data loaded:', contract) // Debug temporal
          setContractInfo({
            fecha_inicio: contract.fecha_ingreso,
            fecha_fin: contract.fecha_fin,
            tipo_contrato: contract.tipo_contrato,
            numero_contrato_helisa: contract.numero_contrato_helisa
          })
        }
      } catch (error) {
        console.error('Error loading contract info:', error)
      }
    }

    loadContractInfo()
  }, [isOpen, contractId])

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
      setFormData({
        tipo_tiempo: 'prorroga',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        motivo: '',
        nueva_fecha_fin: '',
        dias: '',
        programadas: false,
        disfrutadas: false
      })
      setError('')
    }
  }, [isOpen])

  // Actualizar tipo cuando se selecciona
  useEffect(() => {
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        tipo_tiempo: selectedType.id,
        // Limpiar campos específicos
        nueva_fecha_fin: '',
        dias: '',
        programadas: false,
        disfrutadas: false
      }))
    }
  }, [selectedType])

  const handleInputChange = (field: keyof TiempoLaboralData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Verificar si el contrato puede prorrogarse (solo contratos fijos)
  const canExtendContract = () => {
    const canExtend = contractInfo.tipo_contrato === 'fijo' && contractInfo.fecha_fin
    console.log('Can extend contract?', {
      tipo_contrato: contractInfo.tipo_contrato,
      fecha_fin: contractInfo.fecha_fin,
      canExtend
    }) // Debug temporal
    return canExtend
  }

  // Calcular duración actual del contrato
  const calculateContractDuration = () => {
    if (!contractInfo.fecha_inicio || !contractInfo.fecha_fin) return { months: 0, days: 0 }
    
    const inicio = new Date(contractInfo.fecha_inicio)
    const fin = new Date(contractInfo.fecha_fin)
    
    const years = fin.getFullYear() - inicio.getFullYear()
    const months = fin.getMonth() - inicio.getMonth()
    const totalMonths = years * 12 + months
    
    const diffTime = fin.getTime() - inicio.getTime()
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return { months: totalMonths, days: totalDays }
  }

  // Calcular duración de la prórroga
  const calculateExtensionDuration = () => {
    if (!contractInfo.fecha_fin || !formData.nueva_fecha_fin) return { months: 0, days: 0 }
    
    const fechaFinActual = new Date(contractInfo.fecha_fin)
    const nuevaFechaFin = new Date(formData.nueva_fecha_fin)
    
    const years = nuevaFechaFin.getFullYear() - fechaFinActual.getFullYear()
    const months = nuevaFechaFin.getMonth() - fechaFinActual.getMonth()
    const totalMonths = years * 12 + months
    
    const diffTime = nuevaFechaFin.getTime() - fechaFinActual.getTime()
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return { months: totalMonths, days: totalDays }
  }

  const calculateDias = () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) return 0
    const inicio = new Date(formData.fecha_inicio)
    const fin = new Date(formData.fecha_fin)
    const diffTime = fin.getTime() - inicio.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedType) {
      setError('Debes seleccionar un tipo de novedad')
      return
    }

    // Validaciones específicas por tipo
    if (selectedType.id === 'prorroga') {
      if (!formData.nueva_fecha_fin) {
        setError('La nueva fecha de finalización es obligatoria para prórrogas')
        return
      }
      if (contractInfo.fecha_fin && formData.nueva_fecha_fin <= contractInfo.fecha_fin) {
        setError('La nueva fecha debe ser posterior a la fecha actual de finalización')
        return
      }
    }

    if (selectedType.id === 'vacaciones' || selectedType.id === 'suspension') {
      if (!formData.fecha_inicio || !formData.fecha_fin) {
        setError('Las fechas de inicio y fin son obligatorias')
        return
      }
      if (formData.fecha_fin <= formData.fecha_inicio) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio')
        return
      }
    }

    if (!formData.motivo.trim()) {
      setError('El motivo es obligatorio')
      return
    }

    setLoading(true)

    try {
      // Preparar datos para insertar
      const dataToInsert: any = {
        contract_id: contractId,
        tipo_tiempo: formData.tipo_tiempo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin || null,
        motivo: formData.motivo.trim(),
        created_by: user?.id
      }

      // Agregar campos específicos por tipo
      if (selectedType.id === 'prorroga') {
        dataToInsert.nueva_fecha_fin = formData.nueva_fecha_fin
      }

      if (selectedType.id === 'vacaciones' || selectedType.id === 'suspension') {
        const diasCalculados = calculateDias()
        dataToInsert.dias = diasCalculados
      }

      if (selectedType.id === 'vacaciones') {
        dataToInsert.programadas = formData.programadas
        dataToInsert.disfrutadas = formData.disfrutadas
      }

      const { error: insertError } = await supabase
        .from('novedades_tiempo_laboral')
        .insert(dataToInsert)

      if (insertError) {
        throw insertError
      }

      // Éxito
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error saving tiempo laboral novedad:', error)
      setError('Error al guardar la novedad. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <span>Novedad de Tiempo Laboral</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">{contractName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedType ? (
            // Selector de tipo
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selecciona el tipo de novedad de tiempo laboral
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {TIEMPO_LABORAL_TYPES.map((type) => {
                  const Icon = type.icon
                  const isProrroga = type.id === 'prorroga'
                  const canUseProrroga = canExtendContract()
                  const isDisabled = isProrroga && !canUseProrroga
                  
                  return (
                    <div key={type.id} className="relative">
                      <button
                        onClick={() => !isDisabled && setSelectedType(type)}
                        disabled={isDisabled}
                        className={`
                          w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group
                          ${isDisabled 
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                            : `hover:scale-102 hover:shadow-lg ${type.borderColor} ${type.bgColor}`
                          }
                        `}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg border ${
                            isDisabled 
                              ? 'bg-gray-100 border-gray-200' 
                              : `${type.bgColor} ${type.borderColor}`
                          }`}>
                            <Icon className={`h-6 w-6 ${isDisabled ? 'text-gray-400' : type.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-1 ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                              {type.label}
                            </h4>
                            <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                              {type.description}
                            </p>
                            {isDisabled && (
                              <p className="text-xs text-red-500 mt-1">
                                ⚠️ Solo disponible para contratos de tipo "fijo"
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {/* Información del tipo de contrato */}
                      {isProrroga && contractInfo.tipo_contrato && (
                        <div className={`mt-2 p-2 rounded-lg text-xs ${
                          contractInfo.tipo_contrato === 'fijo' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          📋 Contrato actual: <strong>
                            {contractInfo.tipo_contrato}
                          </strong>
                          {contractInfo.tipo_contrato === 'fijo' && contractInfo.fecha_fin && (
                            <span> • Vence: {contractInfo.fecha_fin}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            // Formulario específico
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo seleccionado */}
              <div className={`p-4 rounded-lg ${selectedType.bgColor} ${selectedType.borderColor} border`}>
                <div className="flex items-center space-x-3">
                  <selectedType.icon className={`h-5 w-5 ${selectedType.color}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedType.label}</h3>
                    <p className="text-sm text-gray-600">{selectedType.description}</p>
                  </div>
                </div>
              </div>

              {/* Información del contrato */}
              {contractInfo.fecha_inicio && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                    <span>📋</span>
                    <span>Información del Contrato Actual</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {/* Número de contrato */}
                    {contractInfo.numero_contrato_helisa && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="text-gray-500 text-xs font-medium block">Número:</span>
                        <span className="text-blue-900 font-semibold">{contractInfo.numero_contrato_helisa}</span>
                      </div>
                    )}
                    
                    {/* Tipo de contrato */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <span className="text-gray-500 text-xs font-medium block">Tipo:</span>
                      <span className={`font-semibold ${
                        contractInfo.tipo_contrato === 'fijo' ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {contractInfo.tipo_contrato}
                      </span>
                    </div>
                    
                    {/* Fecha inicio */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <span className="text-gray-500 text-xs font-medium block">Fecha Inicio:</span>
                      <span className="text-blue-900 font-semibold">{contractInfo.fecha_inicio}</span>
                    </div>
                    
                    {/* Fecha fin */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <span className="text-gray-500 text-xs font-medium block">Fecha Fin:</span>
                      <span className={`font-semibold ${contractInfo.fecha_fin ? 'text-blue-900' : 'text-gray-500'}`}>
                        {contractInfo.fecha_fin || 'Indefinido'}
                      </span>
                    </div>
                    
                    {/* Duración actual */}
                    {contractInfo.fecha_fin && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="text-gray-500 text-xs font-medium block">Duración Actual:</span>
                        <span className="text-blue-900 font-semibold">
                          {(() => {
                            const duration = calculateContractDuration()
                            return duration.months > 0 
                              ? `${duration.months} ${duration.months === 1 ? 'mes' : 'meses'}`
                              : `${duration.days} días`
                          })()}
                        </span>
                      </div>
                    )}
                    
                    {/* Días restantes */}
                    {contractInfo.fecha_fin && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="text-gray-500 text-xs font-medium block">Días Restantes:</span>
                        <span className={`font-semibold ${
                          (() => {
                            const today = new Date()
                            const endDate = new Date(contractInfo.fecha_fin)
                            const diffTime = endDate.getTime() - today.getTime()
                            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                            return daysLeft <= 30 ? 'text-red-600' : daysLeft <= 90 ? 'text-orange-600' : 'text-green-600'
                          })()
                        }`}>
                          {(() => {
                            const today = new Date()
                            const endDate = new Date(contractInfo.fecha_fin)
                            const diffTime = endDate.getTime() - today.getTime()
                            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                            return daysLeft > 0 ? `${daysLeft} días` : 'Vencido'
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campos específicos por tipo */}
              {selectedType.id === 'prorroga' && (
                <div className="space-y-6">
                  {/* Nueva fecha de finalización */}
                  <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <span>🔄</span>
                      <span>Nueva Prórroga</span>
                    </h5>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva Fecha de Finalización *
                        </label>
                        <input
                          type="date"
                          value={formData.nueva_fecha_fin}
                          onChange={(e) => handleInputChange('nueva_fecha_fin', e.target.value)}
                          min={contractInfo.fecha_fin || undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {contractInfo.fecha_fin && (
                          <p className="text-xs text-gray-500 mt-1">
                            Debe ser posterior a: <strong>{contractInfo.fecha_fin}</strong>
                          </p>
                        )}
                      </div>

                      {/* Cálculo de duración de la prórroga */}
                      {formData.nueva_fecha_fin && contractInfo.fecha_fin && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                          <h6 className="font-medium text-green-900 mb-3 flex items-center space-x-2">
                            <span>📊</span>
                            <span>Duración de la Prórroga</span>
                          </h6>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            {/* Duración en meses */}
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                              <span className="text-gray-500 text-xs font-medium block">Duración:</span>
                              <span className="text-green-800 font-bold text-lg">
                                {(() => {
                                  const extension = calculateExtensionDuration()
                                  return extension.months > 0 
                                    ? `${extension.months} ${extension.months === 1 ? 'mes' : 'meses'}`
                                    : `${extension.days} días`
                                })()}
                              </span>
                            </div>
                            
                            {/* Desde */}
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                              <span className="text-gray-500 text-xs font-medium block">Desde:</span>
                              <span className="text-green-800 font-semibold">{contractInfo.fecha_fin}</span>
                            </div>
                            
                            {/* Hasta */}
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                              <span className="text-gray-500 text-xs font-medium block">Hasta:</span>
                              <span className="text-green-800 font-semibold">{formData.nueva_fecha_fin}</span>
                            </div>
                            
                            {/* Total días */}
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                              <span className="text-gray-500 text-xs font-medium block">Total Días:</span>
                              <span className="text-green-800 font-semibold">
                                {calculateExtensionDuration().days} días
                              </span>
                            </div>
                          </div>

                          {/* Alertas por duración */}
                          {(() => {
                            const extension = calculateExtensionDuration()
                            if (extension.months >= 12) {
                              return (
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <p className="text-orange-800 text-xs">
                                    ⚠️ <strong>Prórroga de más de 1 año:</strong> Verificar normativa laboral colombiana
                                  </p>
                                </div>
                              )
                            } else if (extension.months >= 6) {
                              return (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-blue-800 text-xs">
                                    ℹ️ <strong>Prórroga considerable:</strong> Considerar contrato indefinido
                                  </p>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(selectedType.id === 'vacaciones' || selectedType.id === 'suspension') && (
                <div className="space-y-6">
                  <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <span>{selectedType.id === 'vacaciones' ? '🏖️' : '⏸️'}</span>
                      <span>Período de {selectedType.id === 'vacaciones' ? 'Vacaciones' : 'Suspensión'}</span>
                    </h5>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Inicio *
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_inicio}
                            onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Fin *
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_fin}
                            onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                            min={formData.fecha_inicio}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Cálculo automático de días */}
                      {formData.fecha_inicio && formData.fecha_fin && (
                        <div className={`p-4 rounded-lg border ${
                          selectedType.id === 'vacaciones' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className={`text-sm font-medium ${
                              selectedType.id === 'vacaciones' ? 'text-green-800' : 'text-orange-800'
                            }`}>
                              📅 Duración calculada:
                            </p>
                            <span className={`font-bold text-lg ${
                              selectedType.id === 'vacaciones' ? 'text-green-900' : 'text-orange-900'
                            }`}>
                              {calculateDias()} días
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                            <div>
                              <span className="text-gray-500">Desde:</span>
                              <span className="ml-2 font-medium">{formData.fecha_inicio}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Hasta:</span>
                              <span className="ml-2 font-medium">{formData.fecha_fin}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para vacaciones */}
              {selectedType.id === 'vacaciones' && (
                <div className="bg-green-50 p-4 lg:p-6 rounded-xl border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
                    <span>⚙️</span>
                    <span>Configuración de Vacaciones</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100 hover:border-green-200 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.programadas}
                        onChange={(e) => handleInputChange('programadas', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Vacaciones Programadas</span>
                        <p className="text-xs text-gray-500">Están previamente planificadas</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100 hover:border-green-200 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.disfrutadas}
                        onChange={(e) => handleInputChange('disfrutadas', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Ya Disfrutadas</span>
                        <p className="text-xs text-gray-500">Ya fueron tomadas por el empleado</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Motivo */}
              <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Motivo de la {selectedType.label} *
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => handleInputChange('motivo', e.target.value)}
                  placeholder={`Describe la razón de la ${selectedType.label.toLowerCase()}...`}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Proporciona una explicación clara y detallada del motivo
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors order-2 sm:order-1"
                >
                  ← Cambiar Tipo
                </button>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#5FD3D2] to-[#58BFC2] text-white font-semibold rounded-lg hover:from-[#58BFC2] hover:to-[#5FD3D2] transition-all duration-200 shadow-lg hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span>Guardar Novedad</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
