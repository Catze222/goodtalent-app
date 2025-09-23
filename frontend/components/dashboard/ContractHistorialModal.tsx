'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface Periodo {
  id?: string
  numero_periodo: number
  fecha_inicio: string
  fecha_fin: string
  tipo_periodo: 'inicial' | 'prorroga_automatica' | 'prorroga_acordada'
  observaciones?: string
}

interface ContractHistorialModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (periodos: Periodo[]) => void
  periodosActuales?: Periodo[]
}

/**
 * Modal súper intuitivo para gestionar el historial de períodos de contratos fijos
 * UX diseñada para ser simple y clara para cualquier usuario
 */
export default function ContractHistorialModal({
  isOpen,
  onClose,
  onSave,
  periodosActuales = []
}: ContractHistorialModalProps) {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Inicializar con períodos existentes o crear uno inicial
  useEffect(() => {
    if (isOpen) {
      if (periodosActuales.length > 0) {
        setPeriodos([...periodosActuales])
      } else {
        // Crear primer período por defecto
        setPeriodos([{
          numero_periodo: 1,
          fecha_inicio: '',
          fecha_fin: '',
          tipo_periodo: 'inicial',
          observaciones: ''
        }])
      }
      setError('')
    }
  }, [isOpen, periodosActuales])

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPeriodos([])
      setError('')
    }
  }, [isOpen])

  const agregarPeriodo = () => {
    let fechaInicioSugerida = ''
    
    // Si hay períodos anteriores, sugerir fecha inicio como día siguiente al último fin
    if (periodos.length > 0) {
      const ultimoPeriodo = periodos[periodos.length - 1]
      if (ultimoPeriodo.fecha_fin) {
        const fechaFin = new Date(ultimoPeriodo.fecha_fin)
        fechaFin.setDate(fechaFin.getDate() + 1)
        fechaInicioSugerida = fechaFin.toISOString().split('T')[0]
      }
    }
    
    const nuevoPeriodo: Periodo = {
      numero_periodo: periodos.length + 1,
      fecha_inicio: fechaInicioSugerida,
      fecha_fin: '',
      tipo_periodo: periodos.length === 0 ? 'inicial' : 'prorroga_automatica',
      observaciones: ''
    }
    setPeriodos([...periodos, nuevoPeriodo])
  }

  const eliminarPeriodo = (index: number) => {
    const nuevos = periodos.filter((_, i) => i !== index)
    // Renumerar los períodos
    const renumerados = nuevos.map((p, i) => ({
      ...p,
      numero_periodo: i + 1,
      tipo_periodo: i === 0 ? 'inicial' : p.tipo_periodo
    }))
    setPeriodos(renumerados)
  }

  const actualizarPeriodo = (index: number, campo: keyof Periodo, valor: string) => {
    const nuevos = [...periodos]
    nuevos[index] = { ...nuevos[index], [campo]: valor }
    
    // Si se actualiza la fecha_fin de un período, actualizar fecha_inicio del siguiente
    if (campo === 'fecha_fin' && valor && index < nuevos.length - 1) {
      const fechaFin = new Date(valor)
      fechaFin.setDate(fechaFin.getDate() + 1)
      const fechaInicioSiguiente = fechaFin.toISOString().split('T')[0]
      
      // Solo actualizar si el siguiente período no tiene fecha_inicio o si está vacía
      if (!nuevos[index + 1].fecha_inicio) {
        nuevos[index + 1] = { ...nuevos[index + 1], fecha_inicio: fechaInicioSiguiente }
      }
    }
    
    setPeriodos(nuevos)
  }

  const calcularTotales = () => {
    let diasTotales = 0
    let periodosValidos = 0

    periodos.forEach(periodo => {
      if (periodo.fecha_inicio && periodo.fecha_fin) {
        const inicio = new Date(periodo.fecha_inicio)
        const fin = new Date(periodo.fecha_fin)
        const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
        diasTotales += dias
        periodosValidos++
      }
    })

    const añosTotales = (diasTotales / 365).toFixed(2)
    
    return {
      totalPeriodos: periodos.length,
      periodosCompletos: periodosValidos,
      diasTotales,
      añosTotales: parseFloat(añosTotales),
      proximoPeriodo: periodos.length + 1 // El contrato actual será este número
    }
  }

  const validarFormulario = () => {
    if (periodos.length === 0) {
      setError('Debe agregar al menos un período')
      return false
    }

    for (let i = 0; i < periodos.length; i++) {
      const periodo = periodos[i]
      
      if (!periodo.fecha_inicio) {
        setError(`El período #${i + 1} debe tener fecha de inicio`)
        return false
      }
      
      if (!periodo.fecha_fin) {
        setError(`El período #${i + 1} debe tener fecha de fin`)
        return false
      }

      const inicio = new Date(periodo.fecha_inicio)
      const fin = new Date(periodo.fecha_fin)
      
      if (inicio >= fin) {
        setError(`En el período #${i + 1}, la fecha de inicio debe ser anterior a la fecha de fin`)
        return false
      }

      // Validar que no se traslapen períodos
      if (i > 0) {
        const periodoAnterior = periodos[i - 1]
        const finAnterior = new Date(periodoAnterior.fecha_fin)
        
        if (inicio <= finAnterior) {
          setError(`El período #${i + 1} no puede iniciar antes del fin del período anterior`)
          return false
        }
      }
    }

    setError('')
    return true
  }

  const handleGuardar = () => {
    if (!validarFormulario()) return

    setLoading(true)
    try {
      onSave(periodos)
      onClose()
    } catch (error) {
      setError('Error al guardar el historial')
    } finally {
      setLoading(false)
    }
  }

  const totales = calcularTotales()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] p-4 flex items-center justify-center overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-0 flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#87E0E0] rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#004C4C]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Historial de Períodos PASADOS</h2>
              <p className="text-[#87E0E0] text-sm">Solo períodos YA TERMINADOS - El contrato actual NO va aquí</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-[#0A6A6A] rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          
          {/* Explicación conceptual */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 text-lg">💡</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">¿Qué va aquí?</h3>
                <div className="text-amber-800 text-sm space-y-1">
                  <p>✅ <strong>Períodos YA TERMINADOS</strong> de contratos anteriores</p>
                  <p>✅ <strong>Prórrogas PASADAS</strong> que ya no están activas</p>
                  <p>❌ <strong>NO incluir</strong> el período actual del contrato</p>
                  <p>🎯 <strong>Importante:</strong> Solo agregar períodos que ya terminaron completamente</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resumen en la parte superior */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Resumen del Historial</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{totales.totalPeriodos}</div>
                <div className="text-blue-600">Períodos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totales.periodosCompletos}</div>
                <div className="text-green-600">Completos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">{totales.añosTotales}</div>
                <div className="text-purple-600">Años totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-700">#{totales.proximoPeriodo}</div>
                <div className="text-orange-600">Contrato actual</div>
              </div>
            </div>

            {/* Alerta legal */}
            {totales.añosTotales >= 4 && (
              <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 font-medium text-sm">
                  ⚠️ ALERTA LEGAL: Más de 4 años trabajados - Debe ser contrato INDEFINIDO
                </span>
              </div>
            )}
          </div>

          {/* Lista de Períodos */}
          <div className="space-y-4">
            {periodos.map((periodo, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 bg-[#004C4C] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {periodo.numero_periodo}
                    </span>
                    <h4 className="font-semibold text-gray-900">
                      Período #{periodo.numero_periodo}
                      {periodo.numero_periodo === 1 ? ' (Inicial)' : ` (Prórroga ${periodo.numero_periodo - 1})`}
                    </h4>
                  </div>
                  
                  {periodos.length > 1 && (
                    <button
                      onClick={() => eliminarPeriodo(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Fecha Inicio */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={periodo.fecha_inicio}
                      onChange={(e) => actualizarPeriodo(index, 'fecha_inicio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Fecha Fin */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha de Fin *
                    </label>
                    <input
                      type="date"
                      value={periodo.fecha_fin}
                      onChange={(e) => actualizarPeriodo(index, 'fecha_fin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Tipo de Período */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tipo de Período
                    </label>
                    <select
                      value={periodo.tipo_periodo}
                      onChange={(e) => actualizarPeriodo(index, 'tipo_periodo', e.target.value)}
                      disabled={index === 0} // El primer período siempre es inicial
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent text-sm disabled:bg-gray-100"
                    >
                      <option value="inicial">Inicial</option>
                      <option value="prorroga_automatica">Prórroga Automática</option>
                      <option value="prorroga_acordada">Prórroga Acordada</option>
                    </select>
                  </div>
                </div>

                {/* Cálculo de duración */}
                {periodo.fecha_inicio && periodo.fecha_fin && (
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Duración: </span>
                    {(() => {
                      const inicio = new Date(periodo.fecha_inicio)
                      const fin = new Date(periodo.fecha_fin)
                      const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
                      const meses = Math.floor(dias / 30)
                      return `${dias} días (≈ ${meses} meses)`
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón Agregar Período */}
          <div className="mt-6">
            <button
              type="button"
              onClick={agregarPeriodo}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-[#87E0E0] text-[#004C4C] rounded-xl hover:bg-[#87E0E0] hover:bg-opacity-10 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Agregar Nuevo Período</span>
            </button>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={loading || totales.periodosCompletos === 0}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white rounded-lg hover:from-[#065C5C] hover:to-[#0A6A6A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              `Guardar Historial (${totales.periodosCompletos} períodos pasados)`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
