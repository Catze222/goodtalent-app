'use client'

import { useState, useEffect } from 'react'
import { X, User, FileText, CheckSquare, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface Contract {
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
}

interface Company {
  id: string
  name: string
  tax_id: string
}

interface ContractModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  contract?: Contract | null
  mode: 'create' | 'edit'
  companies: Company[]
}

/**
 * Modal moderno de 3 pestañas para crear y editar contratos
 * Diseño responsive con stepper horizontal y validaciones en tiempo real
 */
export default function ContractModal({
  isOpen,
  onClose,
  onSuccess,
  contract,
  mode,
  companies
}: ContractModalProps) {
  const [currentTab, setCurrentTab] = useState(0)
  const [formData, setFormData] = useState<Contract>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    fecha_nacimiento: '',
    genero: 'M',
    celular: '',
    email: '',
    empresa_interna: 'Good',
    empresa_final_id: '',
    ciudad_labora: '',
    cargo: '',
    numero_contrato_helisa: '',
    base_sena: false,
    fecha_ingreso: '',
    tipo_contrato: 'Indefinido',
    fecha_fin: '',
    tipo_salario: 'Ordinario',
    salario: 0,
    auxilio_salarial: 0,
    auxilio_salarial_concepto: '',
    auxilio_no_salarial: 0,
    auxilio_no_salarial_concepto: '',
    beneficiario_hijo: 0,
    beneficiario_madre: 0,
    beneficiario_padre: 0,
    beneficiario_conyuge: 0,
    fecha_solicitud: '',
    fecha_radicado: '',
    programacion_cita_examenes: false,
    examenes: false,
    solicitud_inscripcion_arl: false,
    inscripcion_arl: false,
    envio_contrato: false,
    recibido_contrato_firmado: false,
    solicitud_eps: false,
    confirmacion_eps: false,
    envio_inscripcion_caja: false,
    confirmacion_inscripcion_caja: false,
    dropbox: '',
    radicado_eps: false,
    radicado_ccf: false,
    observacion: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Tabs configuration
  const tabs = [
    { id: 0, name: 'Información Personal', icon: User, color: 'text-blue-600' },
    { id: 1, name: 'Detalles del Contrato', icon: FileText, color: 'text-green-600' },
    { id: 2, name: 'Onboarding', icon: CheckSquare, color: 'text-purple-600' }
  ]

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && contract) {
        setFormData({
          // Solo campos que pertenecen a la tabla contracts
          primer_nombre: contract.primer_nombre || '',
          segundo_nombre: contract.segundo_nombre || '',
          primer_apellido: contract.primer_apellido || '',
          segundo_apellido: contract.segundo_apellido || '',
          tipo_identificacion: contract.tipo_identificacion || 'CC',
          numero_identificacion: contract.numero_identificacion || '',
          fecha_nacimiento: contract.fecha_nacimiento || '',
          genero: contract.genero || 'M',
          celular: contract.celular || '',
          email: contract.email || '',
          empresa_interna: contract.empresa_interna || 'Good',
          empresa_final_id: contract.empresa_final_id || '',
          ciudad_labora: contract.ciudad_labora || '',
          cargo: contract.cargo || '',
          numero_contrato_helisa: contract.numero_contrato_helisa || '',
          base_sena: contract.base_sena || false,
          fecha_ingreso: contract.fecha_ingreso || '',
          tipo_contrato: contract.tipo_contrato || 'Indefinido',
          fecha_fin: contract.fecha_fin || '',
          tipo_salario: contract.tipo_salario || 'Ordinario',
          salario: contract.salario || 0,
          auxilio_salarial: contract.auxilio_salarial || 0,
          auxilio_salarial_concepto: contract.auxilio_salarial_concepto || '',
          auxilio_no_salarial: contract.auxilio_no_salarial || 0,
          auxilio_no_salarial_concepto: contract.auxilio_no_salarial_concepto || '',
          beneficiario_hijo: contract.beneficiario_hijo || 0,
          beneficiario_madre: contract.beneficiario_madre || 0,
          beneficiario_padre: contract.beneficiario_padre || 0,
          beneficiario_conyuge: contract.beneficiario_conyuge || 0,
          fecha_solicitud: contract.fecha_solicitud || '',
          fecha_radicado: contract.fecha_radicado || '',
          programacion_cita_examenes: contract.programacion_cita_examenes || false,
          examenes: contract.examenes || false,
          solicitud_inscripcion_arl: contract.solicitud_inscripcion_arl || false,
          inscripcion_arl: contract.inscripcion_arl || false,
          envio_contrato: contract.envio_contrato || false,
          recibido_contrato_firmado: contract.recibido_contrato_firmado || false,
          solicitud_eps: contract.solicitud_eps || false,
          confirmacion_eps: contract.confirmacion_eps || false,
          envio_inscripcion_caja: contract.envio_inscripcion_caja || false,
          confirmacion_inscripcion_caja: contract.confirmacion_inscripcion_caja || false,
          dropbox: contract.dropbox || '',
          radicado_eps: contract.radicado_eps || false,
          radicado_ccf: contract.radicado_ccf || false,
          observacion: contract.observacion || ''
        })
      } else {
        // Reset para crear nuevo
        setFormData({
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          tipo_identificacion: 'CC',
          numero_identificacion: '',
          fecha_nacimiento: '',
          genero: 'M',
          celular: '',
          email: '',
          empresa_interna: 'Good',
          empresa_final_id: companies.length > 0 ? companies[0].id : '',
          ciudad_labora: '',
          cargo: '',
          numero_contrato_helisa: '',
          base_sena: false,
          fecha_ingreso: '',
          tipo_contrato: 'Indefinido',
          fecha_fin: '',
          tipo_salario: 'Ordinario',
          salario: 0,
          auxilio_salarial: 0,
          auxilio_salarial_concepto: '',
          auxilio_no_salarial: 0,
          auxilio_no_salarial_concepto: '',
          beneficiario_hijo: 0,
          beneficiario_madre: 0,
          beneficiario_padre: 0,
          beneficiario_conyuge: 0,
          fecha_solicitud: '',
          fecha_radicado: '',
          programacion_cita_examenes: false,
          examenes: false,
          solicitud_inscripcion_arl: false,
          inscripcion_arl: false,
          envio_contrato: false,
          recibido_contrato_firmado: false,
          solicitud_eps: false,
          confirmacion_eps: false,
          envio_inscripcion_caja: false,
          confirmacion_inscripcion_caja: false,
          dropbox: '',
          radicado_eps: false,
          radicado_ccf: false,
          observacion: ''
        })
      }
      setCurrentTab(0)
      setErrors({})
    }
  }, [isOpen, contract, mode, companies])

  // Validar pestaña actual
  const validateCurrentTab = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentTab === 0) {
      // Información Personal
      if (!formData.primer_nombre.trim()) newErrors.primer_nombre = 'El primer nombre es obligatorio'
      if (!formData.primer_apellido.trim()) newErrors.primer_apellido = 'El primer apellido es obligatorio'
      if (!formData.numero_identificacion.trim()) newErrors.numero_identificacion = 'El número de identificación es obligatorio'
      if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria'
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'El email no tiene un formato válido'
      }
    } else if (currentTab === 1) {
      // Detalles del Contrato
      if (!formData.numero_contrato_helisa.trim()) newErrors.numero_contrato_helisa = 'El número de contrato es obligatorio'
      if (!formData.empresa_final_id) newErrors.empresa_final_id = 'Debe seleccionar una empresa cliente'
      if (formData.tipo_contrato !== 'Indefinido' && !formData.fecha_fin) {
        newErrors.fecha_fin = 'La fecha fin es obligatoria para contratos con duración definida'
      }
      if (formData.salario && formData.salario < 0) newErrors.salario = 'El salario debe ser mayor o igual a 0'
    }
    // Tab 2 (Onboarding) no tiene validaciones obligatorias

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario escribe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Lógica especial para fecha_fin
    if (field === 'tipo_contrato') {
      if (value === 'Indefinido') {
        setFormData(prev => ({ ...prev, fecha_fin: '' }))
      }
    }
  }

  // Navegación entre pestañas
  const nextTab = () => {
    if (validateCurrentTab() && currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1)
    }
  }

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1)
    }
  }

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateCurrentTab()) return

    setLoading(true)
    try {
      // Crear objeto limpio solo con campos que existen en la tabla contracts
      const dataToSave = {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre || null,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido || null,
        tipo_identificacion: formData.tipo_identificacion,
        numero_identificacion: formData.numero_identificacion,
        fecha_nacimiento: formData.fecha_nacimiento,
        genero: formData.genero,
        celular: formData.celular || null,
        email: formData.email || null,
        empresa_interna: formData.empresa_interna,
        empresa_final_id: formData.empresa_final_id,
        ciudad_labora: formData.ciudad_labora || null,
        cargo: formData.cargo || null,
        numero_contrato_helisa: formData.numero_contrato_helisa,
        base_sena: formData.base_sena,
        fecha_ingreso: formData.fecha_ingreso || null,
        tipo_contrato: formData.tipo_contrato || null,
        fecha_fin: formData.fecha_fin || null,
        tipo_salario: formData.tipo_salario || null,
        salario: formData.salario || null,
        auxilio_salarial: formData.auxilio_salarial || null,
        auxilio_salarial_concepto: formData.auxilio_salarial_concepto || null,
        auxilio_no_salarial: formData.auxilio_no_salarial || null,
        auxilio_no_salarial_concepto: formData.auxilio_no_salarial_concepto || null,
        beneficiario_hijo: formData.beneficiario_hijo,
        beneficiario_madre: formData.beneficiario_madre,
        beneficiario_padre: formData.beneficiario_padre,
        beneficiario_conyuge: formData.beneficiario_conyuge,
        fecha_solicitud: formData.fecha_solicitud || null,
        fecha_radicado: formData.fecha_radicado || null,
        programacion_cita_examenes: formData.programacion_cita_examenes,
        examenes: formData.examenes,
        solicitud_inscripcion_arl: formData.solicitud_inscripcion_arl,
        inscripcion_arl: formData.inscripcion_arl,
        envio_contrato: formData.envio_contrato,
        recibido_contrato_firmado: formData.recibido_contrato_firmado,
        solicitud_eps: formData.solicitud_eps,
        confirmacion_eps: formData.confirmacion_eps,
        envio_inscripcion_caja: formData.envio_inscripcion_caja,
        confirmacion_inscripcion_caja: formData.confirmacion_inscripcion_caja,
        dropbox: formData.dropbox || null,
        radicado_eps: formData.radicado_eps,
        radicado_ccf: formData.radicado_ccf,
        observacion: formData.observacion || null,
        // Agregar campos de auditoría
        ...(mode === 'create' && { created_by: (await supabase.auth.getUser()).data.user?.id }),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }

      let error
      if (mode === 'create') {
        const result = await supabase
          .from('contracts')
          .insert([dataToSave])
        error = result.error
      } else {
        const result = await supabase
          .from('contracts')
          .update(dataToSave)
          .eq('id', contract?.id)
        error = result.error
      }

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error('Error saving contract:', error)
      
      if (error.code === '23505') {
        if (error.message.includes('numero_contrato_helisa')) {
          setErrors({ numero_contrato_helisa: 'Este número de contrato ya existe' })
        } else if (error.message.includes('numero_identificacion')) {
          setErrors({ numero_identificacion: 'Esta identificación ya está registrada' })
        }
      } else {
        setErrors({ general: error.message || 'Error al guardar el contrato' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Modal container
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] p-4 flex items-center justify-center overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-auto my-0 flex flex-col h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] sm:h-auto sm:max-h-[calc(100vh-4rem)]">
        
        {/* Header con stepper */}
        <div className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {mode === 'create' ? 'Nuevo Contrato' : 'Editar Contrato'}
              </h2>
              <p className="text-[#87E0E0] text-sm">
                {mode === 'create' ? 'Crear contrato laboral completo' : 'Modificar información del contrato'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-[#0A6A6A] rounded-full flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper horizontal */}
          <div className="flex items-center justify-between">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentTab === index
                        ? 'bg-[#87E0E0] text-[#004C4C]'
                        : currentTab > index
                        ? 'bg-[#5FD3D2] text-[#004C4C]'
                        : 'bg-[#0A6A6A] text-[#87E0E0]'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentTab >= index ? 'text-[#87E0E0]' : 'text-[#58BFC2]'
                    }`}>
                      {tab.name}
                    </p>
                  </div>
                </div>
                {index < tabs.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-[#58BFC2] mx-2 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6">
            
            {/* Error general */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Tab 1: Información Personal */}
            {currentTab === 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal del Empleado</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primer Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.primer_nombre}
                      onChange={(e) => handleInputChange('primer_nombre', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.primer_nombre ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Juan"
                    />
                    {errors.primer_nombre && (
                      <p className="text-red-600 text-xs mt-1">{errors.primer_nombre}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.segundo_nombre}
                      onChange={(e) => handleInputChange('segundo_nombre', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: Carlos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primer Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.primer_apellido}
                      onChange={(e) => handleInputChange('primer_apellido', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.primer_apellido ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Pérez"
                    />
                    {errors.primer_apellido && (
                      <p className="text-red-600 text-xs mt-1">{errors.primer_apellido}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.segundo_apellido}
                      onChange={(e) => handleInputChange('segundo_apellido', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: González"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Identificación *
                    </label>
                    <select
                      value={formData.tipo_identificacion}
                      onChange={(e) => handleInputChange('tipo_identificacion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="PEP">PEP</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Identificación *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_identificacion}
                      onChange={(e) => handleInputChange('numero_identificacion', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.numero_identificacion ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 1234567890"
                    />
                    {errors.numero_identificacion && (
                      <p className="text-red-600 text-xs mt-1">{errors.numero_identificacion}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.fecha_nacimiento ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.fecha_nacimiento && (
                      <p className="text-red-600 text-xs mt-1">{errors.fecha_nacimiento}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género *
                    </label>
                    <select
                      value={formData.genero}
                      onChange={(e) => handleInputChange('genero', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular
                    </label>
                    <input
                      type="tel"
                      value={formData.celular}
                      onChange={(e) => handleInputChange('celular', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: +57 300 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: juan.perez@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Detalles del Contrato */}
            {currentTab === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Contrato</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa Interna *
                    </label>
                    <select
                      value={formData.empresa_interna}
                      onChange={(e) => handleInputChange('empresa_interna', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    >
                      <option value="Good">Good</option>
                      <option value="CPS">CPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa Cliente *
                    </label>
                    <select
                      value={formData.empresa_final_id}
                      onChange={(e) => handleInputChange('empresa_final_id', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.empresa_final_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar empresa...</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name} - {company.tax_id}
                        </option>
                      ))}
                    </select>
                    {errors.empresa_final_id && (
                      <p className="text-red-600 text-xs mt-1">{errors.empresa_final_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad donde Labora
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad_labora}
                      onChange={(e) => handleInputChange('ciudad_labora', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: Bogotá"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange('cargo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: Desarrollador"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Contrato Helisa *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_contrato_helisa}
                      onChange={(e) => handleInputChange('numero_contrato_helisa', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.numero_contrato_helisa ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: CONT-2025-001"
                    />
                    {errors.numero_contrato_helisa && (
                      <p className="text-red-600 text-xs mt-1">{errors.numero_contrato_helisa}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="base_sena"
                      checked={formData.base_sena}
                      onChange={(e) => handleInputChange('base_sena', e.target.checked)}
                      className="w-5 h-5 text-[#004C4C] rounded focus:ring-[#87E0E0] border-gray-300"
                    />
                    <label htmlFor="base_sena" className="text-sm font-medium text-gray-700">
                      Aporta al SENA
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contrato
                    </label>
                    <select
                      value={formData.tipo_contrato}
                      onChange={(e) => handleInputChange('tipo_contrato', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    >
                      <option value="Indefinido">Indefinido</option>
                      <option value="Fijo">Fijo</option>
                      <option value="Obra">Obra</option>
                      <option value="Aprendizaje">Aprendizaje</option>
                    </select>
                  </div>

                  {/* Fecha fin - solo mostrar si no es indefinido */}
                  {formData.tipo_contrato !== 'Indefinido' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Terminación *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                          errors.fecha_fin ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.fecha_fin && (
                        <p className="text-red-600 text-xs mt-1">{errors.fecha_fin}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Salario
                    </label>
                    <select
                      value={formData.tipo_salario}
                      onChange={(e) => handleInputChange('tipo_salario', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    >
                      <option value="Integral">Integral</option>
                      <option value="Ordinario">Ordinario</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.salario || ''}
                      onChange={(e) => handleInputChange('salario', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all ${
                        errors.salario ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 3500000"
                    />
                    {errors.salario && (
                      <p className="text-red-600 text-xs mt-1">{errors.salario}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auxilio Salarial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.auxilio_salarial || ''}
                      onChange={(e) => handleInputChange('auxilio_salarial', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: 150000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Concepto Auxilio Salarial
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_salarial_concepto}
                      onChange={(e) => handleInputChange('auxilio_salarial_concepto', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: Transporte"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auxilio No Salarial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.auxilio_no_salarial || ''}
                      onChange={(e) => handleInputChange('auxilio_no_salarial', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: 100000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Concepto Auxilio No Salarial
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_no_salarial_concepto}
                      onChange={(e) => handleInputChange('auxilio_no_salarial_concepto', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      placeholder="Ej: Alimentación"
                    />
                  </div>
                </div>

                {/* Beneficiarios */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Beneficiarios</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hijos
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.beneficiario_hijo}
                        onChange={(e) => handleInputChange('beneficiario_hijo', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Madre
                      </label>
                      <select
                        value={formData.beneficiario_madre}
                        onChange={(e) => handleInputChange('beneficiario_madre', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      >
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Padre
                      </label>
                      <select
                        value={formData.beneficiario_padre}
                        onChange={(e) => handleInputChange('beneficiario_padre', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      >
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cónyuge
                      </label>
                      <select
                        value={formData.beneficiario_conyuge}
                        onChange={(e) => handleInputChange('beneficiario_conyuge', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                      >
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Onboarding */}
            {currentTab === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Proceso de Onboarding</h3>
                  <div className="text-sm text-gray-600">
                    Progreso: {Math.round(
                      ([
                        formData.programacion_cita_examenes,
                        formData.examenes,
                        formData.solicitud_inscripcion_arl,
                        formData.inscripcion_arl,
                        formData.envio_contrato,
                        formData.recibido_contrato_firmado,
                        formData.solicitud_eps,
                        formData.confirmacion_eps,
                        formData.envio_inscripcion_caja,
                        formData.confirmacion_inscripcion_caja,
                        formData.radicado_eps,
                        formData.radicado_ccf
                      ].filter(Boolean).length / 12) * 100
                    )}%
                  </div>
                </div>

                {/* Fechas importantes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Solicitud
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_solicitud}
                      onChange={(e) => handleInputChange('fecha_solicitud', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Radicado
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_radicado}
                      onChange={(e) => handleInputChange('fecha_radicado', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Checkboxes de onboarding en grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'programacion_cita_examenes', label: 'Programación Cita Exámenes' },
                    { key: 'examenes', label: 'Exámenes Realizados' },
                    { key: 'solicitud_inscripcion_arl', label: 'Solicitud Inscripción ARL' },
                    { key: 'inscripcion_arl', label: 'Inscripción ARL Confirmada' },
                    { key: 'envio_contrato', label: 'Contrato Enviado' },
                    { key: 'recibido_contrato_firmado', label: 'Contrato Firmado Recibido' },
                    { key: 'solicitud_eps', label: 'Solicitud EPS' },
                    { key: 'confirmacion_eps', label: 'EPS Confirmada' },
                    { key: 'envio_inscripcion_caja', label: 'Envío a Caja' },
                    { key: 'confirmacion_inscripcion_caja', label: 'Caja Confirmada' },
                    { key: 'radicado_eps', label: 'Radicado EPS' },
                    { key: 'radicado_ccf', label: 'Radicado CCF' }
                  ].map((field) => (
                    <div key={field.key} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-[#87E0E0] transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={field.key}
                          checked={formData[field.key as keyof Contract] as boolean}
                          onChange={(e) => handleInputChange(field.key, e.target.checked)}
                          className="w-5 h-5 text-[#004C4C] rounded focus:ring-[#87E0E0] border-gray-300"
                        />
                        <label htmlFor={field.key} className="text-sm font-medium text-gray-700 leading-relaxed cursor-pointer">
                          {field.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* URL de Dropbox */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Documentos (Dropbox)
                  </label>
                  <input
                    type="url"
                    value={formData.dropbox}
                    onChange={(e) => handleInputChange('dropbox', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all"
                    placeholder="https://dropbox.com/folder/contract-001"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    rows={4}
                    value={formData.observacion}
                    onChange={(e) => handleInputChange('observacion', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all resize-none"
                    placeholder="Notas adicionales sobre el contrato o proceso de onboarding..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con navegación */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={prevTab}
            disabled={currentTab === 0}
            className={`px-4 py-2 rounded-xl transition-all ${
              currentTab === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            Anterior
          </button>

          <div className="text-sm text-gray-600">
            Paso {currentTab + 1} de {tabs.length}
          </div>

          {currentTab < tabs.length - 1 ? (
            <button
              type="button"
              onClick={nextTab}
              className="px-6 py-2 bg-[#004C4C] text-white rounded-xl hover:bg-[#065C5C] transition-all"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-2 rounded-xl transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#004C4C] hover:bg-[#065C5C]'
              } text-white flex items-center space-x-2`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{mode === 'create' ? 'Crear Contrato' : 'Guardar Cambios'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
