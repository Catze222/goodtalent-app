'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, FileText } from 'lucide-react'
import { Contract } from '../../types/contract'

interface OnboardingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    text?: string
    date?: string
    textField?: string
    dateField: string
  }) => void
  data: {
    contract: Contract | null
    field: string
    title: string
    type: 'arl' | 'eps' | 'caja' | 'cesantias' | 'pension'
  }
}

/**
 * Modal para capturar información adicional en procesos de onboarding
 * Permite ingresar texto descriptivo y fecha de confirmación
 */
export default function OnboardingDetailModal({
  isOpen,
  onClose,
  onSave,
  data
}: OnboardingDetailModalProps) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  // Resetear formulario cuando cambia el modal
  useEffect(() => {
    if (isOpen && data.contract) {
      setText('')
      setDate(new Date().toISOString().split('T')[0]) // Fecha actual por defecto
    }
  }, [isOpen, data.contract])

  // Configuración según el tipo de modal
  const getModalConfig = () => {
    // Para campos que solo requieren fecha (examenes, contrato firmado)
    if (data.field === 'examenes') {
      return {
        textLabel: null, // No requiere campo de texto
        textPlaceholder: '',
        textField: '',
        dateField: 'examenes',
        icon: <FileText className="h-5 w-5" />,
        description: 'Confirma la fecha en que se realizaron los exámenes médicos'
      }
    }
    
    if (data.field === 'recibido_contrato_firmado') {
      return {
        textLabel: null, // No requiere campo de texto
        textPlaceholder: '',
        textField: '',
        dateField: 'contrato',
        icon: <FileText className="h-5 w-5" />,
        description: 'Confirma la fecha en que se recibió el contrato firmado'
      }
    }

    switch (data.type) {
      case 'arl':
        return {
          textLabel: 'Nombre de la ARL',
          textPlaceholder: 'Ej: Positiva, Sura, ARL SURA...',
          textField: 'arl_nombre',
          dateField: 'arl',
          icon: <FileText className="h-5 w-5" />,
          description: 'Ingresa el nombre de la ARL y la fecha de confirmación'
        }
      case 'eps':
        return {
          textLabel: 'Radicado EPS',
          textPlaceholder: 'Ej: RAD-EPS-2025-001',
          textField: 'radicado_eps',
          dateField: 'eps',
          icon: <FileText className="h-5 w-5" />,
          description: 'Ingresa el número de radicado EPS y la fecha de confirmación'
        }
      case 'caja':
        return {
          textLabel: 'Radicado CCF',
          textPlaceholder: 'Ej: RAD-CCF-2025-001',
          textField: 'radicado_ccf',
          dateField: 'caja',
          icon: <FileText className="h-5 w-5" />,
          description: 'Ingresa el número de radicado CCF y la fecha de confirmación'
        }
      case 'cesantias':
        return {
          textLabel: 'Fondo de Cesantías',
          textPlaceholder: 'Ej: Protección, Porvenir, Colfondos...',
          textField: 'fondo_cesantias',
          dateField: 'cesantias',
          icon: <FileText className="h-5 w-5" />,
          description: 'Ingresa el nombre del fondo de cesantías y la fecha de confirmación'
        }
      case 'pension':
        return {
          textLabel: 'Fondo de Pensión',
          textPlaceholder: 'Ej: Protección, Porvenir, Colfondos, Colpensiones...',
          textField: 'fondo_pension',
          dateField: 'pension',
          icon: <FileText className="h-5 w-5" />,
          description: 'Ingresa el nombre del fondo de pensión y la fecha de confirmación'
        }
      default:
        return {
          textLabel: 'Información',
          textPlaceholder: 'Ingresa la información...',
          textField: '',
          dateField: '',
          icon: <FileText className="h-5 w-5" />,
          description: 'Ingresa la información solicitada'
        }
    }
  }

  const config = getModalConfig()

  const handleSave = async () => {
    // Si el campo requiere texto y no está presente, no permitir guardar
    if (config.textLabel && !text.trim()) {
      return
    }

    // Si no hay fecha, no permitir guardar
    if (!date) {
      return
    }

    setLoading(true)
    try {
      await onSave({
        text: config.textLabel ? text.trim() : undefined,
        date,
        textField: config.textField,
        dateField: config.dateField
      })
    } catch (error) {
      console.error('Error saving onboarding details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#004C4C] to-[#065C5C]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg text-white">
              {config.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{data.title}</h3>
              <p className="text-sm text-[#E6F5F7] opacity-90">
                {data.contract?.contracts_full_name || 'Sin nombre'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Descripción */}
          <p className="text-sm text-gray-600">
            {config.description}
          </p>

          {/* Campo de texto - solo si es requerido */}
          {config.textLabel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.textLabel} *
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={config.textPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors"
                disabled={loading}
              />
            </div>
          )}

          {/* Campo de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Fecha de Confirmación *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors"
              disabled={loading}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || (config.textLabel && !text.trim()) || !date}
            className="px-6 py-2 bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white font-medium rounded-lg hover:from-[#065C5C] hover:to-[#0A6A6A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>

      </div>
    </div>
  )
}
