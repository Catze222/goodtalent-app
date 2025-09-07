/**
 * Utilidades para manejo de fechas en zona horaria de Colombia
 */

/**
 * Formatea una fecha en zona horaria de Colombia
 * Evita el problema de que las fechas se muestren un día anterior
 */
export const formatDateColombia = (dateString?: string | null): string => {
  if (!dateString) return '-'
  
  // Crear fecha y agregar offset de Colombia para evitar problemas de zona horaria
  const date = new Date(dateString + 'T00:00:00-05:00') // Colombia UTC-5
  
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota'
  })
}

/**
 * Formatea una fecha completa (con mes) en zona horaria de Colombia
 */
export const formatDateColombiaLong = (dateString?: string | null): string => {
  if (!dateString) return '-'
  
  // Crear fecha y agregar offset de Colombia para evitar problemas de zona horaria
  const date = new Date(dateString + 'T00:00:00-05:00') // Colombia UTC-5
  
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Bogota'
  })
}

/**
 * Convierte una fecha de input (YYYY-MM-DD) a formato ISO considerando Colombia
 */
export const dateInputToISO = (dateInput: string): string => {
  if (!dateInput) return ''
  
  // Input viene como YYYY-MM-DD, convertir a fecha de Colombia
  const date = new Date(dateInput + 'T00:00:00-05:00')
  return date.toISOString().split('T')[0]
}

/**
 * Convierte una fecha ISO a formato de input (YYYY-MM-DD) considerando Colombia
 */
export const dateISOToInput = (isoDate?: string | null): string => {
  if (!isoDate) return ''
  
  // Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria
  return isoDate.split('T')[0]
}
