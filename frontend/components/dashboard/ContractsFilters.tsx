'use client'

import { useState } from 'react'
import { Search, Filter, X, Users, Calendar, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export type FilterStatus = 'all' | 'completed' | 'in_progress' | 'pending'
export type FilterEmpresa = 'all' | 'good' | 'cps'
export type FilterOnboarding = 
  | 'all' 
  | 'completos'
  | 'sin_examenes' 
  | 'sin_arl' 
  | 'sin_eps' 
  | 'sin_contrato'
  | 'sin_programacion_cita'
  | 'sin_solicitud_arl'
  | 'sin_envio_contrato'
  | 'sin_solicitud_eps'
  | 'sin_caja'
  | 'sin_radicados'

interface ContractsFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterEmpresa: FilterEmpresa
  setFilterEmpresa: (filter: FilterEmpresa) => void
  filterOnboarding: FilterOnboarding
  setFilterOnboarding: (filter: FilterOnboarding) => void
  stats: {
    total: number
    good: number
    cps: number
    completed: number
    inProgress: number
    pending: number
    sinExamenes: number
    sinArl: number
    sinEps: number
    sinContrato: number
    sinProgramacionCita: number
    sinSolicitudArl: number
    sinEnvioContrato: number
    sinSolicitudEps: number
    sinCaja: number
    sinRadicados: number
  }
}

/**
 * Filtros avanzados e inteligentes para contratos
 * Con quick filters y estadísticas visuales
 */
export default function ContractsFilters({
  searchTerm,
  setSearchTerm,
  filterEmpresa,
  setFilterEmpresa,
  filterOnboarding,
  setFilterOnboarding,
  stats
}: ContractsFiltersProps) {

  const clearAllFilters = () => {
    setSearchTerm('')
    setFilterEmpresa('all')
    setFilterOnboarding('all')
  }

  const hasActiveFilters = searchTerm || filterEmpresa !== 'all' || filterOnboarding !== 'all'

  return (
    <div className="space-y-4">
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Total */}
        <div 
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            filterOnboarding === 'all' 
              ? 'bg-gradient-to-br from-[#004C4C] to-[#065C5C] text-white' 
              : 'bg-white border border-gray-200 hover:border-[#87E0E0]'
          }`}
          onClick={() => setFilterOnboarding('all')}
        >
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>

        {/* Completados */}
        <div 
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            filterOnboarding === 'completos' 
              ? 'bg-green-500 text-white' 
              : 'bg-green-50 border border-green-200 hover:border-green-300'
          }`}
          onClick={() => setFilterOnboarding('completos')}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className={`h-4 w-4 ${filterOnboarding === 'completos' ? 'text-white' : 'text-green-600'}`} />
            <span className={`text-sm font-medium ${filterOnboarding === 'completos' ? 'text-white' : 'text-green-800'}`}>
              Completos
            </span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${filterOnboarding === 'completos' ? 'text-white' : 'text-green-800'}`}>
            {stats.completed}
          </p>
        </div>

        {/* Sin Exámenes */}
        <div 
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            filterOnboarding === 'sin_examenes' 
              ? 'bg-red-500 text-white' 
              : 'bg-red-50 border border-red-200 hover:border-red-300'
          }`}
          onClick={() => setFilterOnboarding('sin_examenes')}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className={`h-4 w-4 ${filterOnboarding === 'sin_examenes' ? 'text-white' : 'text-red-600'}`} />
            <span className={`text-sm font-medium ${filterOnboarding === 'sin_examenes' ? 'text-white' : 'text-red-800'}`}>
              Sin Exámenes
            </span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${filterOnboarding === 'sin_examenes' ? 'text-white' : 'text-red-800'}`}>
            {stats.sinExamenes}
          </p>
        </div>

        {/* Sin ARL */}
        <div 
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            filterOnboarding === 'sin_arl' 
              ? 'bg-orange-500 text-white' 
              : 'bg-orange-50 border border-orange-200 hover:border-orange-300'
          }`}
          onClick={() => setFilterOnboarding('sin_arl')}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className={`h-4 w-4 ${filterOnboarding === 'sin_arl' ? 'text-white' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${filterOnboarding === 'sin_arl' ? 'text-white' : 'text-orange-800'}`}>
              Sin ARL
            </span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${filterOnboarding === 'sin_arl' ? 'text-white' : 'text-orange-800'}`}>
            {stats.sinArl}
          </p>
        </div>

        {/* Sin EPS */}
        <div 
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            filterOnboarding === 'sin_eps' 
              ? 'bg-purple-500 text-white' 
              : 'bg-purple-50 border border-purple-200 hover:border-purple-300'
          }`}
          onClick={() => setFilterOnboarding('sin_eps')}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className={`h-4 w-4 ${filterOnboarding === 'sin_eps' ? 'text-white' : 'text-purple-600'}`} />
            <span className={`text-sm font-medium ${filterOnboarding === 'sin_eps' ? 'text-white' : 'text-purple-800'}`}>
              Sin EPS
            </span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${filterOnboarding === 'sin_eps' ? 'text-white' : 'text-purple-800'}`}>
            {stats.sinEps}
          </p>
        </div>

        {/* Sin Contrato */}
        <div 
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            filterOnboarding === 'sin_contrato' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-yellow-50 border border-yellow-200 hover:border-yellow-300'
          }`}
          onClick={() => setFilterOnboarding('sin_contrato')}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className={`h-4 w-4 ${filterOnboarding === 'sin_contrato' ? 'text-white' : 'text-yellow-600'}`} />
            <span className={`text-sm font-medium ${filterOnboarding === 'sin_contrato' ? 'text-white' : 'text-yellow-800'}`}>
              Sin Contrato
            </span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${filterOnboarding === 'sin_contrato' ? 'text-white' : 'text-yellow-800'}`}>
            {stats.sinContrato}
          </p>
        </div>
      </div>

      {/* Filtros tradicionales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, identificación, contrato, empresa o cargo..."
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex space-x-3">
            
            {/* Filtro por empresa */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select 
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value as FilterEmpresa)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent appearance-none bg-white min-w-[120px]"
              >
                <option value="all">Todas las empresas</option>
                <option value="good">Good ({stats.good})</option>
                <option value="cps">CPS ({stats.cps})</option>
              </select>
            </div>

            {/* Filtro avanzado de onboarding */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select 
                value={filterOnboarding}
                onChange={(e) => setFilterOnboarding(e.target.value as FilterOnboarding)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#87E0E0] focus:border-transparent appearance-none bg-white min-w-[160px]"
              >
                <option value="all">Todo onboarding</option>
                <option value="completos">Completos ({stats.completed})</option>
                <option value="sin_examenes">Sin exámenes ({stats.sinExamenes})</option>
                <option value="sin_arl">Sin ARL ({stats.sinArl})</option>
                <option value="sin_eps">Sin EPS ({stats.sinEps})</option>
                <option value="sin_contrato">Sin contrato ({stats.sinContrato})</option>
              </select>
            </div>

            {/* Botón limpiar */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Contador de resultados */}
        {hasActiveFilters && (
          <div className="mt-3 text-sm text-gray-600 flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>
              Filtros activos: {[
                searchTerm && 'búsqueda',
                filterEmpresa !== 'all' && `empresa (${filterEmpresa})`,
                filterOnboarding !== 'all' && `onboarding`
              ].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
