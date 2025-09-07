'use client'

import { Contract } from '../../types/contract'

interface ContractModalOnboardingProps {
  formData: Contract
  isReadOnly: boolean
  handleInputChange: (field: string, value: any) => void
  getInputProps: (field: string) => any
  getCheckboxProps: () => any
  errors: Record<string, string>
}

/**
 * Sección reorganizada de onboarding para ContractModal
 * Organizada por procesos con campos condicionales
 */
export default function ContractModalOnboarding({
  formData,
  isReadOnly,
  handleInputChange,
  getInputProps,
  getCheckboxProps,
  errors
}: ContractModalOnboardingProps) {
  
  return (
    <div className="space-y-4">
      
      {/* 🏥 EXÁMENES MÉDICOS */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          🏥 Exámenes Médicos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="programacion_cita_examenes"
              checked={formData.programacion_cita_examenes}
              onChange={(e) => !isReadOnly && handleInputChange('programacion_cita_examenes', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="programacion_cita_examenes" className="text-sm font-medium text-gray-700 cursor-pointer">
              Programación Cita
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="examenes"
              checked={formData.examenes}
              disabled={!formData.programacion_cita_examenes || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.programacion_cita_examenes) {
                  if (e.target.checked) {
                    // Si se marca, inicializar fecha para que aparezca el campo
                    if (!formData.examenes_fecha) handleInputChange('examenes_fecha', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar fecha
                    handleInputChange('examenes_fecha', '')
                  }
                  handleInputChange('examenes', e.target.checked)
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.programacion_cita_examenes 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="examenes" 
              className={`text-sm font-medium transition-colors ${
                !formData.programacion_cita_examenes 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              Exámenes Realizados
            </label>
          </div>
          {formData.examenes && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Exámenes *
              </label>
              <input
                type="date"
                value={formData.examenes_fecha || ''}
                onChange={(e) => !isReadOnly && handleInputChange('examenes_fecha', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                  errors.examenes_fecha ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.examenes_fecha && (
                <p className="text-red-600 text-xs mt-1">{errors.examenes_fecha}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 📄 CONTRATOS */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          📄 Contratos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="envio_contrato"
              checked={formData.envio_contrato}
              onChange={(e) => !isReadOnly && handleInputChange('envio_contrato', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="envio_contrato" className="text-sm font-medium text-gray-700 cursor-pointer">
              Contrato Enviado
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="recibido_contrato_firmado"
              checked={formData.recibido_contrato_firmado}
              disabled={!formData.envio_contrato || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.envio_contrato) {
                  if (e.target.checked) {
                    // Si se marca, inicializar fecha para que aparezca el campo
                    if (!formData.contrato_fecha_confirmacion) handleInputChange('contrato_fecha_confirmacion', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar fecha
                    handleInputChange('contrato_fecha_confirmacion', '')
                  }
                  handleInputChange('recibido_contrato_firmado', e.target.checked)
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.envio_contrato 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="recibido_contrato_firmado" 
              className={`text-sm font-medium transition-colors ${
                !formData.envio_contrato 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              Contrato Firmado Recibido
            </label>
          </div>
          {formData.recibido_contrato_firmado && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Confirmación *
              </label>
              <input
                type="date"
                value={formData.contrato_fecha_confirmacion || ''}
                onChange={(e) => !isReadOnly && handleInputChange('contrato_fecha_confirmacion', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                  errors.contrato_fecha_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.contrato_fecha_confirmacion && (
                <p className="text-red-600 text-xs mt-1">{errors.contrato_fecha_confirmacion}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🛡️ ARL */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          🛡️ ARL
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="solicitud_inscripcion_arl"
              checked={formData.solicitud_inscripcion_arl}
              onChange={(e) => !isReadOnly && handleInputChange('solicitud_inscripcion_arl', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="solicitud_inscripcion_arl" className="text-sm font-medium text-gray-700 cursor-pointer">
              Solicitud ARL
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="confirmacion_arl_virtual"
              checked={!!(formData.arl_nombre && formData.arl_fecha_confirmacion)}
              disabled={!formData.solicitud_inscripcion_arl || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.solicitud_inscripcion_arl) {
                  if (e.target.checked) {
                    // Si se marca, inicializar campos con valores por defecto para que aparezcan
                    if (!formData.arl_nombre) handleInputChange('arl_nombre', ' ') // Espacio para activar
                    if (!formData.arl_fecha_confirmacion) handleInputChange('arl_fecha_confirmacion', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar datos
                    handleInputChange('arl_nombre', '')
                    handleInputChange('arl_fecha_confirmacion', '')
                  }
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.solicitud_inscripcion_arl 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="confirmacion_arl_virtual" 
              className={`text-sm font-medium transition-colors ${
                !formData.solicitud_inscripcion_arl 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              ARL Confirmada
            </label>
          </div>
          {(formData.solicitud_inscripcion_arl && (
            (typeof formData.arl_nombre === 'string' && formData.arl_nombre.trim()) || 
            formData.arl_fecha_confirmacion
          )) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la ARL *
                </label>
                <input
                  type="text"
                  value={formData.arl_nombre || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('arl_nombre', e.target.value)}
                  placeholder="Ej: Positiva, Sura..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.arl_nombre ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.arl_nombre && (
                  <p className="text-red-600 text-xs mt-1">{errors.arl_nombre}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Confirmación *
                </label>
                <input
                  type="date"
                  value={formData.arl_fecha_confirmacion || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('arl_fecha_confirmacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.arl_fecha_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.arl_fecha_confirmacion && (
                  <p className="text-red-600 text-xs mt-1">{errors.arl_fecha_confirmacion}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🏥 EPS */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          🏥 EPS
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="solicitud_eps"
              checked={formData.solicitud_eps}
              onChange={(e) => !isReadOnly && handleInputChange('solicitud_eps', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="solicitud_eps" className="text-sm font-medium text-gray-700 cursor-pointer">
              Solicitud EPS
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="confirmacion_eps_virtual"
              checked={!!(formData.radicado_eps && formData.eps_fecha_confirmacion)}
              disabled={!formData.solicitud_eps || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.solicitud_eps) {
                  if (e.target.checked) {
                    // Si se marca, inicializar campos con valores por defecto para que aparezcan
                    if (!formData.radicado_eps) handleInputChange('radicado_eps', ' ') // Espacio para activar
                    if (!formData.eps_fecha_confirmacion) handleInputChange('eps_fecha_confirmacion', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar datos
                    handleInputChange('radicado_eps', '')
                    handleInputChange('eps_fecha_confirmacion', '')
                  }
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.solicitud_eps 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="confirmacion_eps_virtual" 
              className={`text-sm font-medium transition-colors ${
                !formData.solicitud_eps 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              EPS Confirmada
            </label>
          </div>
          {(formData.solicitud_eps && (
            (typeof formData.radicado_eps === 'string' && formData.radicado_eps.trim()) || 
            formData.eps_fecha_confirmacion
          )) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radicado EPS *
                </label>
                <input
                  type="text"
                  value={formData.radicado_eps || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('radicado_eps', e.target.value)}
                  placeholder="Ej: RAD-EPS-2025-001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.radicado_eps ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.radicado_eps && (
                  <p className="text-red-600 text-xs mt-1">{errors.radicado_eps}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Confirmación *
                </label>
                <input
                  type="date"
                  value={formData.eps_fecha_confirmacion || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('eps_fecha_confirmacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.eps_fecha_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.eps_fecha_confirmacion && (
                  <p className="text-red-600 text-xs mt-1">{errors.eps_fecha_confirmacion}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 👨‍👩‍👧‍👦 CAJA DE COMPENSACIÓN */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          👨‍👩‍👧‍👦 Caja de Compensación
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="envio_inscripcion_caja"
              checked={formData.envio_inscripcion_caja}
              onChange={(e) => !isReadOnly && handleInputChange('envio_inscripcion_caja', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="envio_inscripcion_caja" className="text-sm font-medium text-gray-700 cursor-pointer">
              Solicitud Caja
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="confirmacion_caja_virtual"
              checked={!!(formData.radicado_ccf && formData.caja_fecha_confirmacion)}
              disabled={!formData.envio_inscripcion_caja || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.envio_inscripcion_caja) {
                  if (e.target.checked) {
                    // Si se marca, inicializar campos con valores por defecto para que aparezcan
                    if (!formData.radicado_ccf) handleInputChange('radicado_ccf', ' ') // Espacio para activar
                    if (!formData.caja_fecha_confirmacion) handleInputChange('caja_fecha_confirmacion', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar datos
                    handleInputChange('radicado_ccf', '')
                    handleInputChange('caja_fecha_confirmacion', '')
                  }
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.envio_inscripcion_caja 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="confirmacion_caja_virtual" 
              className={`text-sm font-medium transition-colors ${
                !formData.envio_inscripcion_caja 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              Caja Confirmada
            </label>
          </div>
          {(formData.envio_inscripcion_caja && (
            (typeof formData.radicado_ccf === 'string' && formData.radicado_ccf.trim()) || 
            formData.caja_fecha_confirmacion
          )) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radicado CCF *
                </label>
                <input
                  type="text"
                  value={formData.radicado_ccf || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('radicado_ccf', e.target.value)}
                  placeholder="Ej: RAD-CCF-2025-001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.radicado_ccf ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.radicado_ccf && (
                  <p className="text-red-600 text-xs mt-1">{errors.radicado_ccf}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Confirmación *
                </label>
                <input
                  type="date"
                  value={formData.caja_fecha_confirmacion || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('caja_fecha_confirmacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.caja_fecha_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.caja_fecha_confirmacion && (
                  <p className="text-red-600 text-xs mt-1">{errors.caja_fecha_confirmacion}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 💰 CESANTÍAS */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          💰 Cesantías
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="solicitud_cesantias"
              checked={formData.solicitud_cesantias}
              onChange={(e) => !isReadOnly && handleInputChange('solicitud_cesantias', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="solicitud_cesantias" className="text-sm font-medium text-gray-700 cursor-pointer">
              Solicitud Cesantías
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="confirmacion_cesantias_virtual"
              checked={!!(formData.fondo_cesantias && formData.cesantias_fecha_confirmacion)}
              disabled={!formData.solicitud_cesantias || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.solicitud_cesantias) {
                  if (e.target.checked) {
                    // Si se marca, inicializar campos con valores por defecto para que aparezcan
                    if (!formData.fondo_cesantias) handleInputChange('fondo_cesantias', ' ') // Espacio para activar
                    if (!formData.cesantias_fecha_confirmacion) handleInputChange('cesantias_fecha_confirmacion', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar datos
                    handleInputChange('fondo_cesantias', '')
                    handleInputChange('cesantias_fecha_confirmacion', '')
                  }
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.solicitud_cesantias 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="confirmacion_cesantias_virtual" 
              className={`text-sm font-medium transition-colors ${
                !formData.solicitud_cesantias 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              Cesantías Confirmadas
            </label>
          </div>
          {(formData.solicitud_cesantias && (
            (typeof formData.fondo_cesantias === 'string' && formData.fondo_cesantias.trim()) || 
            formData.cesantias_fecha_confirmacion
          )) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fondo de Cesantías *
                </label>
                <input
                  type="text"
                  value={formData.fondo_cesantias || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('fondo_cesantias', e.target.value)}
                  placeholder="Ej: Protección, Porvenir..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.fondo_cesantias ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.fondo_cesantias && (
                  <p className="text-red-600 text-xs mt-1">{errors.fondo_cesantias}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Confirmación *
                </label>
                <input
                  type="date"
                  value={formData.cesantias_fecha_confirmacion || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('cesantias_fecha_confirmacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.cesantias_fecha_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.cesantias_fecha_confirmacion && (
                  <p className="text-red-600 text-xs mt-1">{errors.cesantias_fecha_confirmacion}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🏦 FONDO DE PENSIÓN */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
          🏦 Fondo de Pensión
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="solicitud_fondo_pension"
              checked={formData.solicitud_fondo_pension}
              onChange={(e) => !isReadOnly && handleInputChange('solicitud_fondo_pension', e.target.checked)}
              {...getCheckboxProps()}
            />
            <label htmlFor="solicitud_fondo_pension" className="text-sm font-medium text-gray-700 cursor-pointer">
              Solicitud Fondo Pensión
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="confirmacion_pension_virtual"
              checked={!!(formData.fondo_pension && formData.pension_fecha_confirmacion)}
              disabled={!formData.solicitud_fondo_pension || isReadOnly}
              onChange={(e) => {
                if (!isReadOnly && formData.solicitud_fondo_pension) {
                  if (e.target.checked) {
                    // Si se marca, inicializar campos con valores por defecto para que aparezcan
                    if (!formData.fondo_pension) handleInputChange('fondo_pension', ' ') // Espacio para activar
                    if (!formData.pension_fecha_confirmacion) handleInputChange('pension_fecha_confirmacion', new Date().toISOString().split('T')[0])
                  } else {
                    // Si se desmarca, limpiar datos
                    handleInputChange('fondo_pension', '')
                    handleInputChange('pension_fecha_confirmacion', '')
                  }
                }
              }}
              className={`w-4 h-4 rounded border transition-colors ${
                !formData.solicitud_fondo_pension 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-gray-300 text-[#5FD3D2] focus:ring-[#87E0E0] focus:ring-2'
              }`}
            />
            <label 
              htmlFor="confirmacion_pension_virtual" 
              className={`text-sm font-medium transition-colors ${
                !formData.solicitud_fondo_pension 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 cursor-pointer'
              }`}
            >
              Pensión Confirmada
            </label>
          </div>
          {(formData.solicitud_fondo_pension && (
            (typeof formData.fondo_pension === 'string' && formData.fondo_pension.trim()) || 
            formData.pension_fecha_confirmacion
          )) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fondo de Pensión *
                </label>
                <input
                  type="text"
                  value={formData.fondo_pension || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('fondo_pension', e.target.value)}
                  placeholder="Ej: Protección, Porvenir, Colpensiones..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.fondo_pension ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.fondo_pension && (
                  <p className="text-red-600 text-xs mt-1">{errors.fondo_pension}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Confirmación *
                </label>
                <input
                  type="date"
                  value={formData.pension_fecha_confirmacion || ''}
                  onChange={(e) => !isReadOnly && handleInputChange('pension_fecha_confirmacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] ${
                    errors.pension_fecha_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.pension_fecha_confirmacion && (
                  <p className="text-red-600 text-xs mt-1">{errors.pension_fecha_confirmacion}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
