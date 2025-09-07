'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, FileText, CheckSquare, ChevronRight, Shield, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { Contract, getContractStatusConfig, calculateTotalRemuneration, formatCurrency } from '../../types/contract'
import OCRButton from '../ocr/OCRButton'
import ContractModalOnboarding from './ContractModalOnboarding'
import CompanySelector from '../ui/CompanySelector'



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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Lógica de estados del contrato
  const statusConfig = contract ? getContractStatusConfig(contract) : null
  const isReadOnly = Boolean(contract && statusConfig && !statusConfig.can_edit)
  
  const [formData, setFormData] = useState<Contract>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_identificacion: '',
    numero_identificacion: '',
    fecha_expedicion_documento: '',
    fecha_nacimiento: '',
    celular: '',
    email: '',
    empresa_interna: '',
    empresa_final_id: '',
    ciudad_labora: '',
    cargo: '',
    numero_contrato_helisa: null,
          base_sena: true,
    fecha_ingreso: '',
    tipo_contrato: '',
    fecha_fin: '',
    tipo_salario: '',
    salario: 0,
    auxilio_salarial: 0,
    auxilio_salarial_concepto: '',
    auxilio_no_salarial: 0,
    auxilio_no_salarial_concepto: '',
  auxilio_transporte: 0,
  tiene_condicion_medica: false,
  condicion_medica_detalle: '',
  beneficiario_hijo: 0,
  beneficiario_madre: 0,
  beneficiario_padre: 0,
  beneficiario_conyuge: 0,
    fecha_solicitud: '',
    fecha_radicado: '',
    programacion_cita_examenes: false,
    examenes: false,
    examenes_fecha: '',
    solicitud_inscripcion_arl: false,
    arl_nombre: '',
    arl_fecha_confirmacion: '',
    envio_contrato: false,
    recibido_contrato_firmado: false,
    contrato_fecha_confirmacion: '',
    solicitud_eps: false,
    eps_fecha_confirmacion: '',
    envio_inscripcion_caja: false,
    caja_fecha_confirmacion: '',
    solicitud_cesantias: false,
    fondo_cesantias: '',
    cesantias_fecha_confirmacion: '',
    solicitud_fondo_pension: false,
    fondo_pension: '',
    pension_fecha_confirmacion: '',
    dropbox: '',
    radicado_eps: '',
    radicado_ccf: '',
    observacion: '',
    status_aprobacion: 'borrador'
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, 'alto' | 'medio' | 'bajo'>>({})

  // Manejar datos extraídos por OCR
  const handleOCRDataExtracted = (extractedFields: any, confidence: any) => {
    console.log('📄 Datos extraídos por OCR:', extractedFields)
    console.log('📊 Confianza de campos:', confidence)
    
    // Actualizar formData con los campos extraídos
    setFormData(prev => ({
      ...prev,
      ...extractedFields
    }))

    // Actualizar confianza de los campos
    setFieldConfidence(confidence)

    // Limpiar errores de campos que fueron llenados automáticamente
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(extractedFields).forEach(field => {
        if (extractedFields[field]) {
          delete newErrors[field]
        }
      })
      return newErrors
    })

    // Mostrar mensaje de éxito con tipo de documento detectado
    const documentType = extractedFields.tipo_identificacion === 'CC' ? 'Cédula de Ciudadanía' : 
                        extractedFields.tipo_identificacion === 'CE' ? 'Cédula de Extranjería' : 'documento'
    console.log(`✅ ${documentType} procesada exitosamente con Gemini`)
  }

  // Helper para props de inputs con lógica de solo lectura
  const getInputProps = (fieldName: string, hasError: boolean = false) => ({
    readOnly: !!isReadOnly,
    disabled: !!isReadOnly,
    tabIndex: isReadOnly ? -1 : 0,
    className: `w-full px-4 py-3 border rounded-xl transition-all ${
      isReadOnly 
        ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 select-none pointer-events-none' 
        : `focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent ${
            hasError ? 'border-red-300' : 'border-gray-300'
          }`
    }`
  })

  // Helper para checkboxes
  const getCheckboxProps = () => ({
    disabled: !!isReadOnly,
    className: `${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} w-5 h-5 text-[#004C4C] rounded focus:ring-[#87E0E0] border-gray-300`
  })

  // Formatear número con puntos como separadores de miles
  const formatNumberWithDots = (value: number | string) => {
    if (!value) return ''
    const numStr = value.toString().replace(/\./g, '') // Remover puntos existentes
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Convertir string con puntos a número
  const parseNumberFromDots = (value: string) => {
    return parseFloat(value.replace(/\./g, '')) || 0
  }

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
          tipo_identificacion: contract.tipo_identificacion || '',
          numero_identificacion: contract.numero_identificacion || '',
          fecha_expedicion_documento: contract.fecha_expedicion_documento || '',
          fecha_nacimiento: contract.fecha_nacimiento || '',
          celular: contract.celular || '',
          email: contract.email || '',
          empresa_interna: contract.empresa_interna || '',
          empresa_final_id: contract.empresa_final_id || '',
          ciudad_labora: contract.ciudad_labora || '',
          cargo: contract.cargo || '',
          numero_contrato_helisa: contract.numero_contrato_helisa || null,
          base_sena: contract.base_sena || false,
          fecha_ingreso: contract.fecha_ingreso || '',
          tipo_contrato: contract.tipo_contrato || '',
          fecha_fin: contract.fecha_fin || '',
          tipo_salario: contract.tipo_salario || '',
          salario: contract.salario || 0,
          auxilio_salarial: contract.auxilio_salarial || 0,
          auxilio_salarial_concepto: contract.auxilio_salarial_concepto || '',
          auxilio_no_salarial: contract.auxilio_no_salarial || 0,
          auxilio_no_salarial_concepto: contract.auxilio_no_salarial_concepto || '',
          auxilio_transporte: contract.auxilio_transporte || 0,
          tiene_condicion_medica: contract.tiene_condicion_medica || false,
          condicion_medica_detalle: contract.condicion_medica_detalle || '',
          beneficiario_hijo: contract.beneficiario_hijo || 0,
          beneficiario_madre: contract.beneficiario_madre || 0,
          beneficiario_padre: contract.beneficiario_padre || 0,
          beneficiario_conyuge: contract.beneficiario_conyuge || 0,
          fecha_solicitud: contract.fecha_solicitud || '',
          fecha_radicado: contract.fecha_radicado || '',
          programacion_cita_examenes: contract.programacion_cita_examenes || false,
          examenes: contract.examenes || false,
          examenes_fecha: contract.examenes_fecha || '',
          solicitud_inscripcion_arl: contract.solicitud_inscripcion_arl || false,
          arl_nombre: contract.arl_nombre || '',
          arl_fecha_confirmacion: contract.arl_fecha_confirmacion || '',
          envio_contrato: contract.envio_contrato || false,
          recibido_contrato_firmado: contract.recibido_contrato_firmado || false,
          contrato_fecha_confirmacion: contract.contrato_fecha_confirmacion || '',
          solicitud_eps: contract.solicitud_eps || false,
          eps_fecha_confirmacion: contract.eps_fecha_confirmacion || '',
          envio_inscripcion_caja: contract.envio_inscripcion_caja || false,
          caja_fecha_confirmacion: contract.caja_fecha_confirmacion || '',
          solicitud_cesantias: contract.solicitud_cesantias || false,
          fondo_cesantias: contract.fondo_cesantias || '',
          cesantias_fecha_confirmacion: contract.cesantias_fecha_confirmacion || '',
          solicitud_fondo_pension: contract.solicitud_fondo_pension || false,
          fondo_pension: contract.fondo_pension || '',
          pension_fecha_confirmacion: contract.pension_fecha_confirmacion || '',
          dropbox: contract.dropbox || '',
          radicado_eps: contract.radicado_eps || '',
          radicado_ccf: contract.radicado_ccf || '',
          observacion: contract.observacion || ''
        })
      } else {
        // Reset para crear nuevo
        setFormData({
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          tipo_identificacion: '',
          numero_identificacion: '',
          fecha_expedicion_documento: '',
          fecha_nacimiento: '',
          celular: '',
          email: '',
          empresa_interna: '',
          empresa_final_id: '',
          ciudad_labora: '',
          cargo: '',
          numero_contrato_helisa: null,
          base_sena: true,
          fecha_ingreso: '',
          tipo_contrato: '',
          fecha_fin: '',
          tipo_salario: '',
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
          envio_contrato: false,
          recibido_contrato_firmado: false,
          solicitud_eps: false,
          envio_inscripcion_caja: false,
          solicitud_cesantias: false,
          solicitud_fondo_pension: false,
          dropbox: '',
          radicado_eps: '',
          radicado_ccf: '',
          observacion: '',
          status_aprobacion: 'borrador'
        })
      }
      setCurrentTab(0)
      setErrors({})
    }
  }, [isOpen, contract, mode, companies])

  // Validar todos los campos y obtener errores por pestaña
  const validateAllFields = (): { errors: Record<string, string>, errorsByTab: Record<number, string[]> } => {
    const newErrors: Record<string, string> = {}
    const errorsByTab: Record<number, string[]> = { 0: [], 1: [], 2: [] }

    // Información Personal (Tab 0)
    if (!formData.primer_nombre.trim()) {
      newErrors.primer_nombre = 'El primer nombre es obligatorio'
      errorsByTab[0].push('primer_nombre')
    }
    if (!formData.primer_apellido.trim()) {
      newErrors.primer_apellido = 'El primer apellido es obligatorio'
      errorsByTab[0].push('primer_apellido')
    }
    if (!formData.numero_identificacion.trim()) {
      newErrors.numero_identificacion = 'El número de identificación es obligatorio'
      errorsByTab[0].push('numero_identificacion')
    }
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria'
      errorsByTab[0].push('fecha_nacimiento')
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido'
      errorsByTab[0].push('email')
    }

    // Detalles del Contrato (Tab 1)
    // El número de contrato no es obligatorio en edición - solo al aprobar
    if (!formData.empresa_final_id) {
      newErrors.empresa_final_id = 'Debe seleccionar una empresa cliente'
      errorsByTab[1].push('empresa_final_id')
    }
    if (formData.tipo_contrato !== 'Indefinido' && !formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha fin es obligatoria para contratos con duración definida'
      errorsByTab[1].push('fecha_fin')
    }
    if (formData.salario && formData.salario < 0) {
      newErrors.salario = 'El salario debe ser mayor o igual a 0'
      errorsByTab[1].push('salario')
    }

    // Validación de condición médica
    if (formData.tiene_condicion_medica && !(typeof formData.condicion_medica_detalle === 'string' && formData.condicion_medica_detalle.trim())) {
      newErrors.condicion_medica_detalle = 'Debe describir la condición médica cuando está marcada'
      errorsByTab[1].push('condicion_medica_detalle')
    }

    // Tab 2 (Onboarding) - Validaciones estrictas
    // Si marcas un checkbox, los campos asociados son obligatorios
    
    // Exámenes realizados → fecha obligatoria
    if (formData.examenes && !formData.examenes_fecha) {
      newErrors.examenes_fecha = 'La fecha de exámenes es obligatoria cuando se marca como realizados'
      errorsByTab[2].push('examenes_fecha')
    }
    
    // Contrato firmado recibido → fecha obligatoria
    if (formData.recibido_contrato_firmado && !formData.contrato_fecha_confirmacion) {
      newErrors.contrato_fecha_confirmacion = 'La fecha de confirmación es obligatoria cuando se marca contrato recibido'
      errorsByTab[2].push('contrato_fecha_confirmacion')
    }
    
    // ARL solicitada con datos → nombre y fecha obligatorios
    if (formData.solicitud_inscripcion_arl && (
      (typeof formData.arl_nombre === 'string' && formData.arl_nombre.trim()) || 
      formData.arl_fecha_confirmacion
    )) {
      if (!(typeof formData.arl_nombre === 'string' && formData.arl_nombre.trim())) {
        newErrors.arl_nombre = 'El nombre de la ARL es obligatorio cuando se proporciona información de confirmación'
        errorsByTab[2].push('arl_nombre')
      }
      if (!formData.arl_fecha_confirmacion) {
        newErrors.arl_fecha_confirmacion = 'La fecha de confirmación ARL es obligatoria cuando se proporciona información de confirmación'
        errorsByTab[2].push('arl_fecha_confirmacion')
      }
    }
    
    // EPS solicitada con datos → radicado y fecha obligatorios
    if (formData.solicitud_eps && (
      (typeof formData.radicado_eps === 'string' && formData.radicado_eps.trim()) || 
      formData.eps_fecha_confirmacion
    )) {
      if (!(typeof formData.radicado_eps === 'string' && formData.radicado_eps.trim())) {
        newErrors.radicado_eps = 'El radicado EPS es obligatorio cuando se proporciona información de confirmación'
        errorsByTab[2].push('radicado_eps')
      }
      if (!formData.eps_fecha_confirmacion) {
        newErrors.eps_fecha_confirmacion = 'La fecha de confirmación EPS es obligatoria cuando se proporciona información de confirmación'
        errorsByTab[2].push('eps_fecha_confirmacion')
      }
    }
    
    // Caja enviada con datos → radicado y fecha obligatorios
    if (formData.envio_inscripcion_caja && (
      (typeof formData.radicado_ccf === 'string' && formData.radicado_ccf.trim()) || 
      formData.caja_fecha_confirmacion
    )) {
      if (!(typeof formData.radicado_ccf === 'string' && formData.radicado_ccf.trim())) {
        newErrors.radicado_ccf = 'El radicado CCF es obligatorio cuando se proporciona información de confirmación'
        errorsByTab[2].push('radicado_ccf')
      }
      if (!formData.caja_fecha_confirmacion) {
        newErrors.caja_fecha_confirmacion = 'La fecha de confirmación caja es obligatoria cuando se proporciona información de confirmación'
        errorsByTab[2].push('caja_fecha_confirmacion')
      }
    }
    
    // Solicitud cesantías → fondo y fecha obligatorios SOLO SI HAY DATOS DE CONFIRMACIÓN
    if (formData.solicitud_cesantias && (
      (typeof formData.fondo_cesantias === 'string' && formData.fondo_cesantias.trim()) || 
      formData.cesantias_fecha_confirmacion
    )) {
      if (!(typeof formData.fondo_cesantias === 'string' && formData.fondo_cesantias.trim())) {
        newErrors.fondo_cesantias = 'El fondo de cesantías es obligatorio cuando se proporciona información de confirmación'
        errorsByTab[2].push('fondo_cesantias')
      }
      if (!formData.cesantias_fecha_confirmacion) {
        newErrors.cesantias_fecha_confirmacion = 'La fecha de confirmación de cesantías es obligatoria cuando se proporciona información de confirmación'
        errorsByTab[2].push('cesantias_fecha_confirmacion')
      }
    }
    
    // Solicitud fondo pensión → fondo y fecha obligatorios SOLO SI HAY DATOS DE CONFIRMACIÓN  
    if (formData.solicitud_fondo_pension && (
      (typeof formData.fondo_pension === 'string' && formData.fondo_pension.trim()) || 
      formData.pension_fecha_confirmacion
    )) {
      if (!(typeof formData.fondo_pension === 'string' && formData.fondo_pension.trim())) {
        newErrors.fondo_pension = 'El fondo de pensión es obligatorio cuando se proporciona información de confirmación'
        errorsByTab[2].push('fondo_pension')
      }
      if (!formData.pension_fecha_confirmacion) {
        newErrors.pension_fecha_confirmacion = 'La fecha de confirmación de pensión es obligatoria cuando se proporciona información de confirmación'
        errorsByTab[2].push('pension_fecha_confirmacion')
      }
    }

    return { errors: newErrors, errorsByTab }
  }

  // Validar pestaña actual (para retrocompatibilidad)
  const validateCurrentTab = (): boolean => {
    const { errors } = validateAllFields()
    const currentTabErrors = Object.keys(errors).filter(field => {
      if (currentTab === 0) {
        return ['primer_nombre', 'primer_apellido', 'numero_identificacion', 'fecha_nacimiento', 'email'].includes(field)
      } else if (currentTab === 1) {
        return ['empresa_final_id', 'fecha_fin', 'salario'].includes(field)
      } else if (currentTab === 2) {
        return [
          'examenes_fecha', 'contrato_fecha_confirmacion', 'arl_nombre', 'arl_fecha_confirmacion',
          'radicado_eps', 'eps_fecha_confirmacion', 'radicado_ccf', 'caja_fecha_confirmacion',
          'fondo_cesantias', 'cesantias_fecha_confirmacion', 'fondo_pension', 'pension_fecha_confirmacion'
        ].includes(field)
      }
      return false
    })

    const currentTabErrorsObj = currentTabErrors.reduce((acc, field) => {
      acc[field] = errors[field]
      return acc
    }, {} as Record<string, string>)

    setErrors(currentTabErrorsObj)
    return currentTabErrors.length === 0
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

  // Navegación libre entre pestañas
  const goToTab = (tabIndex: number) => {
    setCurrentTab(tabIndex)
    // Scroll al inicio del modal al cambiar de pestaña
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const nextTab = () => {
    if (currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1)
      // Scroll al inicio del modal al cambiar de pestaña
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1)
      // Scroll al inicio del modal al cambiar de pestaña
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }

  // Enviar formulario con validación inteligente
  const handleSubmit = async () => {
    const { errors, errorsByTab } = validateAllFields()
    
    if (Object.keys(errors).length > 0) {
      // Encontrar la primera pestaña con errores
      const firstTabWithErrors = Object.keys(errorsByTab).find(tabIndex => 
        errorsByTab[parseInt(tabIndex)].length > 0
      )
      
      if (firstTabWithErrors) {
        setCurrentTab(parseInt(firstTabWithErrors))
        setErrors(errors)
        
        // Mostrar mensaje indicando que hay errores y dónde
        const tabNames = ['Información Personal', 'Detalles del Contrato', 'Onboarding']
        const errorTabs = Object.keys(errorsByTab)
          .filter(tabIndex => errorsByTab[parseInt(tabIndex)].length > 0)
          .map(tabIndex => tabNames[parseInt(tabIndex)])
        
        // Crear mensaje detallado de errores para debugging
        const detailedErrors = Object.keys(errors)
          .filter(key => key !== 'general')
          .map(key => `${key}: ${errors[key]}`)
        
        console.log('🔍 ERRORES DETALLADOS:', detailedErrors)
        console.log('📋 ERRORES POR TAB:', errorsByTab)
        
        setErrors({
          ...errors,
          general: `Hay campos obligatorios pendientes en: ${errorTabs.join(', ')}. Ver consola para detalles.`
        })
      }
      return
    }

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
        fecha_expedicion_documento: formData.fecha_expedicion_documento || null,
        fecha_nacimiento: formData.fecha_nacimiento,
        celular: formData.celular || null,
        email: formData.email || null,
        empresa_interna: formData.empresa_interna,
        empresa_final_id: formData.empresa_final_id,
        ciudad_labora: formData.ciudad_labora || null,
        cargo: formData.cargo || null,
        numero_contrato_helisa: null,
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
        auxilio_transporte: formData.auxilio_transporte || null,
        tiene_condicion_medica: formData.tiene_condicion_medica || false,
        condicion_medica_detalle: (typeof formData.condicion_medica_detalle === 'string' && formData.condicion_medica_detalle.trim()) || null,
        beneficiario_hijo: formData.beneficiario_hijo,
        beneficiario_madre: formData.beneficiario_madre,
        beneficiario_padre: formData.beneficiario_padre,
        beneficiario_conyuge: formData.beneficiario_conyuge,
        fecha_solicitud: formData.fecha_solicitud || null,
        fecha_radicado: formData.fecha_radicado || null,
        programacion_cita_examenes: formData.programacion_cita_examenes,
        examenes: formData.examenes,
        examenes_fecha: formData.examenes_fecha || null,
        solicitud_inscripcion_arl: formData.solicitud_inscripcion_arl,
        arl_nombre: (typeof formData.arl_nombre === 'string' && formData.arl_nombre.trim()) || null,
        arl_fecha_confirmacion: formData.arl_fecha_confirmacion || null,
        envio_contrato: formData.envio_contrato,
        recibido_contrato_firmado: formData.recibido_contrato_firmado,
        contrato_fecha_confirmacion: formData.contrato_fecha_confirmacion || null,
        solicitud_eps: formData.solicitud_eps,
        eps_fecha_confirmacion: formData.eps_fecha_confirmacion || null,
        envio_inscripcion_caja: formData.envio_inscripcion_caja,
        caja_fecha_confirmacion: formData.caja_fecha_confirmacion || null,
        solicitud_cesantias: formData.solicitud_cesantias,
        fondo_cesantias: (typeof formData.fondo_cesantias === 'string' && formData.fondo_cesantias.trim()) || null,
        cesantias_fecha_confirmacion: formData.cesantias_fecha_confirmacion || null,
        solicitud_fondo_pension: formData.solicitud_fondo_pension,
        fondo_pension: (typeof formData.fondo_pension === 'string' && formData.fondo_pension.trim()) || null,
        pension_fecha_confirmacion: formData.pension_fecha_confirmacion || null,
        dropbox: formData.dropbox || null,
        radicado_eps: (typeof formData.radicado_eps === 'string' && formData.radicado_eps.trim()) || null,
        radicado_ccf: (typeof formData.radicado_ccf === 'string' && formData.radicado_ccf.trim()) || null,
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
        <div className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-lg font-bold">
                {mode === 'create' ? 'Nuevo Contrato' : isReadOnly ? 'Ver Contrato' : 'Editar Contrato'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 hover:bg-[#0A6A6A] rounded-full flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper horizontal clickeable */}
          <div className="flex items-center justify-between">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center">
                <div className="flex items-center">
                  <button
                    onClick={() => goToTab(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                      currentTab === index
                        ? 'bg-[#87E0E0] text-[#004C4C] shadow-lg'
                        : currentTab > index
                        ? 'bg-[#5FD3D2] text-[#004C4C] hover:bg-[#87E0E0]'
                        : 'bg-[#0A6A6A] text-[#87E0E0] hover:bg-[#065C5C]'
                    }`}
                    title={`Ir a ${tab.name}`}
                  >
                    <tab.icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => goToTab(index)}
                    className="ml-2 hidden sm:block"
                  >
                    <p className={`text-xs font-medium transition-colors hover:text-[#87E0E0] ${
                      currentTab >= index ? 'text-[#87E0E0]' : 'text-[#58BFC2]'
                    }`}>
                      {tab.name}
                    </p>
                  </button>
                </div>
                {index < tabs.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-[#58BFC2] mx-2 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4">
            
            {/* Error general */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Tab 1: Información Personal */}
            {currentTab === 0 && (
              <div className="space-y-3 lg:space-y-4">
                {/* Botón OCR - Solo mostrar en modo creación */}
                {mode === 'create' && (
                  <div className="mb-4 flex justify-end">
                    <OCRButton
                      onDataExtracted={handleOCRDataExtracted}
                      disabled={isReadOnly}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Primero: Tipo de documento y número */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tipo de Identificación *
                    </label>
                    <select
                      value={formData.tipo_identificacion}
                      onChange={(e) => !isReadOnly && handleInputChange('tipo_identificacion', e.target.value)}
                      {...getInputProps('tipo_identificacion')}
                    >
                      <option value="">Seleccionar tipo de documento...</option>
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="PEP">PEP</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Número de Identificación *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_identificacion}
                      onChange={(e) => !isReadOnly && handleInputChange('numero_identificacion', e.target.value)}
                      {...getInputProps('numero_identificacion', !!errors.numero_identificacion)}
                      placeholder="Ej: 1234567890"
                    />
                    {errors.numero_identificacion && (
                      <p className="text-red-600 text-xs mt-1">{errors.numero_identificacion}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha de Expedición del Documento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_expedicion_documento || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('fecha_expedicion_documento', e.target.value)}
                      {...getInputProps('fecha_expedicion_documento')}
                    />
                  </div>

                  {/* Separador visual */}
                  <div className="col-span-1 lg:col-span-2">
                    <hr className="border-gray-200 my-4" />
                    <h4 className="text-md font-medium text-gray-800 mb-4">Información Personal</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Primer Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.primer_nombre}
                      onChange={(e) => !isReadOnly && handleInputChange('primer_nombre', e.target.value)}
                      {...getInputProps('primer_nombre', !!errors.primer_nombre)}
                      placeholder="Ej: Juan"
                    />
                    {errors.primer_nombre && (
                      <p className="text-red-600 text-xs mt-1">{errors.primer_nombre}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.segundo_nombre || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('segundo_nombre', e.target.value)}
                      {...getInputProps('segundo_nombre')}
                      placeholder="Ej: Carlos"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Primer Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.primer_apellido}
                      onChange={(e) => !isReadOnly && handleInputChange('primer_apellido', e.target.value)}
                      {...getInputProps('primer_apellido', !!errors.primer_apellido)}
                      placeholder="Ej: Pérez"
                    />
                    {errors.primer_apellido && (
                      <p className="text-red-600 text-xs mt-1">{errors.primer_apellido}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.segundo_apellido || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('segundo_apellido', e.target.value)}
                      {...getInputProps('segundo_apellido')}
                      placeholder="Ej: González"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => !isReadOnly && handleInputChange('fecha_nacimiento', e.target.value)}
                      {...getInputProps('fecha_nacimiento', !!errors.fecha_nacimiento)}
                    />
                    {errors.fecha_nacimiento && (
                      <p className="text-red-600 text-xs mt-1">{errors.fecha_nacimiento}</p>
                    )}
                  </div>


                  {/* Separador visual */}
                  <div className="col-span-1 lg:col-span-2">
                    <hr className="border-gray-200 my-3" />
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Información de Contacto</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      type="tel"
                      value={formData.celular || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('celular', e.target.value)}
                      {...getInputProps('celular')}
                      placeholder="Ej: +57 300 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('email', e.target.value)}
                      {...getInputProps('email', !!errors.email)}
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
              <div className="space-y-3 lg:space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Detalles del Contrato</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Empresa Interna *
                    </label>
                    <select
                      value={formData.empresa_interna}
                      onChange={(e) => !isReadOnly && handleInputChange('empresa_interna', e.target.value)}
                      {...getInputProps('empresa_interna')}
                    >
                      <option value="">Seleccionar empresa interna...</option>
                      <option value="Good">Good</option>
                      <option value="CPS">CPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Empresa Cliente *
                    </label>
                    <CompanySelector
                      companies={companies}
                      selectedCompanyId={formData.empresa_final_id}
                      onCompanySelect={(companyId) => !isReadOnly && handleInputChange('empresa_final_id', companyId)}
                      placeholder="Buscar y seleccionar empresa cliente..."
                      disabled={isReadOnly}
                      error={!!errors.empresa_final_id}
                    />
                    {errors.empresa_final_id && (
                      <p className="text-red-600 text-xs mt-1">{errors.empresa_final_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ciudad donde Labora
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad_labora || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('ciudad_labora', e.target.value)}
                      {...getInputProps('ciudad_labora')}
                      placeholder="Ej: Bogotá"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.cargo || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('cargo', e.target.value)}
                      {...getInputProps('cargo')}
                      placeholder="Ej: Desarrollador"
                    />
                  </div>



                  {/* Campo SENA mejorado con tooltip */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="base_sena"
                          checked={formData.base_sena}
                          onChange={(e) => !isReadOnly && handleInputChange('base_sena', e.target.checked)}
                          {...getCheckboxProps()}
                          className="w-5 h-5"
                        />
                        <div className="text-base font-bold text-blue-800 flex items-center space-x-2">
                          <span>🏛️ Aporta al SENA</span>
                          <div className="relative group">
                            <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-help">
                              ?
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-64">
                              <div className="font-medium mb-1">ℹ️ Cargos que NO aplican al SENA:</div>
                              <ul className="list-disc list-inside space-y-0.5">
                                <li>Conductores</li>
                                <li>Aprendices</li>
                                <li>Extranjeros</li>
                                <li>Dirección/Confianza</li>
                                <li>Manejo</li>
                              </ul>
                              {/* Flecha del tooltip */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Contrato - Fila completa */}
                  <div className="col-span-1 lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tipo de Contrato
                    </label>
                    <select
                      value={formData.tipo_contrato || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('tipo_contrato', e.target.value)}
                      {...getInputProps('tipo_contrato')}
                    >
                      <option value="">Seleccionar tipo de contrato...</option>
                      <option value="Indefinido">Indefinido</option>
                      <option value="Fijo">Fijo</option>
                      <option value="Obra">Obra</option>
                      <option value="Aprendizaje">Aprendizaje</option>
                    </select>
                  </div>

                  {/* Fechas - Una fila para las dos fechas */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('fecha_ingreso', e.target.value)}
                      {...getInputProps('fecha_ingreso')}
                    />
                  </div>

                  {/* Fecha fin SIEMPRE visible - se deshabilita si es indefinido */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha de Terminación
                      {formData.tipo_contrato === 'Indefinido' && (
                        <span className="text-xs text-gray-500 ml-1">(No aplica)</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.tipo_contrato === 'Indefinido' ? '' : formData.fecha_fin || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('fecha_fin', e.target.value)}
                      {...getInputProps('fecha_fin', !!errors.fecha_fin)}
                      disabled={formData.tipo_contrato === 'Indefinido' || isReadOnly}
                      className={`${getInputProps('fecha_fin', !!errors.fecha_fin).className} ${
                        formData.tipo_contrato === 'Indefinido' 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : ''
                      }`}
                    />
                    {errors.fecha_fin && formData.tipo_contrato !== 'Indefinido' && (
                      <p className="text-red-600 text-xs mt-1">{errors.fecha_fin}</p>
                    )}
                  </div>

                  {/* Tipo de Salario - Fila completa */}
                  <div className="col-span-1 lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tipo de Salario
                    </label>
                    <select
                      value={formData.tipo_salario || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('tipo_salario', e.target.value)}
                      {...getInputProps('tipo_salario')}
                    >
                      <option value="">Seleccionar tipo de salario...</option>
                      <option value="Integral">Integral</option>
                      <option value="Ordinario">Ordinario</option>
                    </select>
                  </div>

                  {/* Layout fijo - Salario y Auxilio Transporte siempre juntos */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Salario
                    </label>
                    <input
                      type="text"
                      value={formData.salario ? formatNumberWithDots(formData.salario) : ''}
                      onChange={(e) => {
                        if (!isReadOnly) {
                          const numericValue = parseNumberFromDots(e.target.value)
                          handleInputChange('salario', numericValue)
                        }
                      }}
                      {...getInputProps('salario', !!errors.salario)}
                      placeholder="Ej: 3.500.000"
                    />
                    {errors.salario && (
                      <p className="text-red-600 text-xs mt-1">{errors.salario}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Auxilio de Transporte
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_transporte ? formatNumberWithDots(formData.auxilio_transporte) : ''}
                      onChange={(e) => {
                        if (!isReadOnly) {
                          const numericValue = parseNumberFromDots(e.target.value)
                          handleInputChange('auxilio_transporte', numericValue)
                        }
                      }}
                      {...getInputProps('auxilio_transporte')}
                      placeholder="Ej: 140.606"
                    />
                  </div>

                  {/* Layout fijo - Auxilios siempre numero y concepto lado a lado */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Auxilio Salarial
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_salarial ? formatNumberWithDots(formData.auxilio_salarial) : ''}
                      onChange={(e) => {
                        if (!isReadOnly) {
                          const numericValue = parseNumberFromDots(e.target.value)
                          handleInputChange('auxilio_salarial', numericValue)
                        }
                      }}
                      {...getInputProps('auxilio_salarial')}
                      placeholder="Ej: 150.000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Concepto Auxilio Salarial
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_salarial_concepto || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('auxilio_salarial_concepto', e.target.value)}
                      {...getInputProps('auxilio_salarial_concepto')}
                      placeholder="Ej: Transporte"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Auxilio No Salarial
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_no_salarial ? formatNumberWithDots(formData.auxilio_no_salarial) : ''}
                      onChange={(e) => {
                        if (!isReadOnly) {
                          const numericValue = parseNumberFromDots(e.target.value)
                          handleInputChange('auxilio_no_salarial', numericValue)
                        }
                      }}
                      {...getInputProps('auxilio_no_salarial')}
                      placeholder="Ej: 100.000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Concepto Auxilio No Salarial
                    </label>
                    <input
                      type="text"
                      value={formData.auxilio_no_salarial_concepto || ''}
                      onChange={(e) => !isReadOnly && handleInputChange('auxilio_no_salarial_concepto', e.target.value)}
                      {...getInputProps('auxilio_no_salarial_concepto')}
                      placeholder="Ej: Alimentación"
                    />
                  </div>

                  {/* Total Remuneración - Campo calculado */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-green-800 mb-1">
                        💰 Total Remuneración
                      </label>
                      <div className="text-base font-bold text-green-900">
                        {formatCurrency(calculateTotalRemuneration(formData))}
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        Salario + Aux. Salarial + Aux. No Salarial (excluye aux. transporte)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Condición Médica */}
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">🏥 Información Médica</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="tiene_condicion_medica"
                        checked={formData.tiene_condicion_medica}
                        onChange={(e) => !isReadOnly && handleInputChange('tiene_condicion_medica', e.target.checked)}
                        {...getCheckboxProps()}
                      />
                      <label htmlFor="tiene_condicion_medica" className="text-sm font-medium text-gray-700">
                        El empleado tiene alguna condición médica especial
                      </label>
                    </div>

                    {/* Campo de detalle solo si tiene condición médica */}
                    {formData.tiene_condicion_medica && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Descripción de la Condición Médica *
                        </label>
                        <textarea
                          rows={3}
                          value={formData.condicion_medica_detalle || ''}
                          onChange={(e) => !isReadOnly && handleInputChange('condicion_medica_detalle', e.target.value)}
                          {...getInputProps('condicion_medica_detalle')}
                          placeholder="Describe detalladamente la condición médica..."
                          style={{ resize: 'none' }}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Esta información es confidencial y se usará únicamente para adaptar el puesto de trabajo.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Beneficiarios */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Beneficiarios</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hijos
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.beneficiario_hijo === 0 ? '' : formData.beneficiario_hijo}
                        onChange={(e) => !isReadOnly && handleInputChange('beneficiario_hijo', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Madre
                      </label>
                      <select
                        value={formData.beneficiario_madre}
                        onChange={(e) => !isReadOnly && handleInputChange('beneficiario_madre', parseInt(e.target.value))}
                        {...getInputProps('beneficiario_madre')}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Padre
                      </label>
                      <select
                        value={formData.beneficiario_padre}
                        onChange={(e) => !isReadOnly && handleInputChange('beneficiario_padre', parseInt(e.target.value))}
                        {...getInputProps('beneficiario_padre')}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cónyuge
                      </label>
                      <select
                        value={formData.beneficiario_conyuge}
                        onChange={(e) => !isReadOnly && handleInputChange('beneficiario_conyuge', parseInt(e.target.value))}
                        {...getInputProps('beneficiario_conyuge')}
                      >
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fechas de Inscripción Beneficiarios */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Fechas de Inscripción Beneficiarios</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha de Solicitud
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_solicitud || ''}
                        onChange={(e) => !isReadOnly && handleInputChange('fecha_solicitud', e.target.value)}
                        {...getInputProps('fecha_solicitud')}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha de Radicado
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_radicado || ''}
                        onChange={(e) => !isReadOnly && handleInputChange('fecha_radicado', e.target.value)}
                        {...getInputProps('fecha_radicado')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Onboarding */}
            {currentTab === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Proceso de Onboarding</h3>
                  <div className="text-sm text-gray-600">
                    Progreso: {Math.round(
                      (                      [
                        formData.programacion_cita_examenes,
                        formData.examenes && formData.examenes_fecha,
                        formData.envio_contrato,
                        formData.recibido_contrato_firmado && formData.contrato_fecha_confirmacion,
                        formData.solicitud_inscripcion_arl,
                        formData.arl_nombre && formData.arl_fecha_confirmacion,
                        formData.solicitud_eps,
                        formData.radicado_eps && formData.eps_fecha_confirmacion,
                        formData.envio_inscripcion_caja,
                        formData.radicado_ccf && formData.caja_fecha_confirmacion,
                        formData.solicitud_cesantias && formData.fondo_cesantias && formData.cesantias_fecha_confirmacion,
                        formData.solicitud_fondo_pension && formData.fondo_pension && formData.pension_fecha_confirmacion
                      ].filter(Boolean).length / 12) * 100
                    )}%
                  </div>
                </div>



                {/* Onboarding reorganizado por procesos */}
                <ContractModalOnboarding
                  formData={formData}
                  isReadOnly={isReadOnly}
                  handleInputChange={handleInputChange}
                  getInputProps={getInputProps}
                  getCheckboxProps={getCheckboxProps}
                  errors={errors}
                />

                {/* URL de Dropbox */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Documentos (Dropbox)
                  </label>
                  <input
                    type="url"
                    value={formData.dropbox || ''}
                    onChange={(e) => !isReadOnly && handleInputChange('dropbox', e.target.value)}
                    {...getInputProps('dropbox')}
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
                    value={formData.observacion || ''}
                    onChange={(e) => !isReadOnly && handleInputChange('observacion', e.target.value)}
                    {...getInputProps('observacion')}
                    placeholder="Notas adicionales sobre el contrato o proceso de onboarding..."
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con navegación */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={prevTab}
            disabled={currentTab === 0}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
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
              className="px-4 py-1.5 bg-[#004C4C] text-white rounded-lg hover:bg-[#065C5C] transition-all text-sm"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || isReadOnly}
              className={`px-4 py-1.5 rounded-lg transition-all text-sm ${
                loading || isReadOnly
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#004C4C] hover:bg-[#065C5C]'
              } text-white flex items-center space-x-2`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>
                {isReadOnly 
                  ? 'Solo Lectura' 
                  : mode === 'create' 
                    ? 'Crear Contrato' 
                    : 'Guardar Cambios'
                }
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
