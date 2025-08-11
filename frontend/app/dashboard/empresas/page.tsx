'use client'

import { Building2, Plus, Search } from 'lucide-react'

/**
 * Página del módulo Empresas
 * Placeholder para futuro desarrollo
 */
export default function EmpresasPage() {
  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-[#87E0E0]" />
            <span>Empresas</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de empresas clientes y sus configuraciones
          </p>
        </div>
        
        <button className="bg-gradient-to-r from-[#004C4C] to-[#065C5C] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#065C5C] hover:to-[#0A6A6A] transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nueva Empresa</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empresas por nombre, NIT o contacto..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <select className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent">
              <option>Todas las empresas</option>
              <option>Activas</option>
              <option>Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-[#87E0E0] to-[#5FD3D2] rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-[#004C4C]" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Módulo en Desarrollo
          </h3>
          
          <p className="text-gray-600 mb-6">
            El módulo de gestión de empresas estará disponible próximamente. 
            Incluirá funcionalidades para administrar empresas clientes, 
            configuraciones y datos corporativos.
          </p>
          
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900">Funcionalidades planificadas:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Registro y edición de empresas</li>
              <li>• Gestión de datos corporativos</li>
              <li>• Configuración de parámetros</li>
              <li>• Reportes empresariales</li>
              <li>• Integración con nómina</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
