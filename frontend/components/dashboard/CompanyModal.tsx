'use client'

import { useState, useEffect } from 'react'
import { X, Building2, User, Mail, Phone, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface Company {
  id?: string
  name: string
  tax_id: string
  accounts_contact_name: string
  accounts_contact_email: string
  accounts_contact_phone: string
  status: boolean
}

interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  company?: Company | null
  mode: 'create' | 'edit'
}

/**
 * Modal moderno para crear y editar empresas
 * Diseño responsive con glassmorphism y validaciones en tiempo real
 */
export default function CompanyModal({
  isOpen,
  onClose,
  onSuccess,
  company,
  mode
}: CompanyModalProps) {
  const [formData, setFormData] = useState<Company>({
    name: '',
    tax_id: '',
    accounts_contact_name: '',
    accounts_contact_email: '',
    accounts_contact_phone: '',
    status: true
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Las notificaciones visuales se manejan desde el padre con Toast

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
      if (mode === 'edit' && company) {
        setFormData(company)
      } else {
        setFormData({
          name: '',
          tax_id: '',
          accounts_contact_name: '',
          accounts_contact_email: '',
          accounts_contact_phone: '',
          status: true
        })
      }
      setErrors({})
    }
  }, [isOpen, company, mode])

  // Validaciones en tiempo real
  const validateField = (name: string, value: string | boolean) => {
    switch (name) {
      case 'name':
        return typeof value === 'string' && value.trim().length >= 2 
          ? '' : 'El nombre debe tener al menos 2 caracteres'
      
      case 'tax_id':
        return typeof value === 'string' && /^[0-9]{7,15}$/.test(value.replace(/\D/g, ''))
          ? '' : 'NIT debe tener entre 7 y 15 dígitos'
      
      case 'accounts_contact_name':
        return typeof value === 'string' && value.trim().length >= 2
          ? '' : 'El nombre del contacto debe tener al menos 2 caracteres'
      
      case 'accounts_contact_email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return typeof value === 'string' && emailRegex.test(value)
          ? '' : 'Email inválido'
      
      case 'accounts_contact_phone':
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/
        return typeof value === 'string' && phoneRegex.test(value.replace(/\s/g, ''))
          ? '' : 'Teléfono inválido (7-15 dígitos)'
      
      default:
        return ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Validar en tiempo real
    const error = validateField(name, newValue)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'status') {
        const error = validateField(key, value)
        if (error) newErrors[key] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      if (mode === 'create') {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Usuario no autenticado')
        }

        const { error } = await supabase
          .from('companies')
          .insert([{
            name: formData.name.trim(),
            tax_id: formData.tax_id.replace(/\D/g, ''),
            accounts_contact_name: formData.accounts_contact_name.trim(),
            accounts_contact_email: formData.accounts_contact_email.trim().toLowerCase(),
            accounts_contact_phone: formData.accounts_contact_phone.trim(),
            status: formData.status,
            created_by: user.id,
            updated_by: user.id
          }])

        if (error) throw error
        onSuccess()
        onClose()
        return
      } else {
        // Obtener el usuario actual para updated_by
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Usuario no autenticado')
        }

        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name.trim(),
            tax_id: formData.tax_id.replace(/\D/g, ''),
            accounts_contact_name: formData.accounts_contact_name.trim(),
            accounts_contact_email: formData.accounts_contact_email.trim().toLowerCase(),
            accounts_contact_phone: formData.accounts_contact_phone.trim(),
            status: formData.status,
            updated_by: user.id
          })
          .eq('id', company?.id)

        if (error) throw error
        onSuccess()
        onClose()
        return
      }

      // Éxito ya gestionado

    } catch (error: any) {
      console.error('Error saving company:', error)
      
      if (error.code === '23505') {
        setErrors({ tax_id: 'Este NIT ya está registrado' })
      } else {
        setErrors({ general: error.message || 'Error al guardar la empresa' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] p-4 flex items-center justify-center overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto my-0 flex flex-col h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] sm:h-auto sm:max-h-[calc(100vh-4rem)]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#87E0E0] rounded-full flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#004C4C]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {mode === 'create' ? 'Nueva Empresa' : 'Editar Empresa'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 hover:bg-[#0A6A6A] rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          
          {/* Mensaje de éxito eliminado: padre mostrará Toast */}

          {/* Error general */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Información de la Empresa */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-[#004C4C]" />
                <h3 className="text-base font-semibold text-gray-900">Información de la Empresa</h3>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Good Temporal SAS"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* NIT */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  NIT *
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors ${
                    errors.tax_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="900123456"
                  required
                />
                {errors.tax_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>
                )}
              </div>

              {/* Estado */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="status"
                  id="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#87E0E0] border-gray-300 rounded focus:ring-[#87E0E0]"
                />
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Empresa activa
                </label>
              </div>
            </div>

            {/* Contacto de Cuentas por Cobrar */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-[#004C4C]" />
                <h3 className="text-base font-semibold text-gray-900">Contacto de Cuentas por Cobrar</h3>
              </div>

              {/* Nombre del contacto */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="accounts_contact_name"
                  value={formData.accounts_contact_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors ${
                    errors.accounts_contact_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: María Pérez González"
                  required
                />
                {errors.accounts_contact_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.accounts_contact_name}</p>
                )}
              </div>

              {/* Email y Teléfono en grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="accounts_contact_email"
                      value={formData.accounts_contact_email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors ${
                        errors.accounts_contact_email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="mperez@empresa.com"
                      required
                    />
                  </div>
                  {errors.accounts_contact_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.accounts_contact_email}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="accounts_contact_phone"
                      value={formData.accounts_contact_phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-[#87E0E0] transition-colors ${
                        errors.accounts_contact_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+57 300 123 4567"
                      required
                    />
                  </div>
                  {errors.accounts_contact_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.accounts_contact_phone}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white rounded-lg hover:from-[#065C5C] hover:to-[#0A6A6A] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              mode === 'create' ? 'Crear Empresa' : 'Actualizar Empresa'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
