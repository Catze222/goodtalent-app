/**
 * Tipos compartidos para el sistema de OCR de cédulas colombianas
 * GOOD Talent - 2025
 */

// Niveles de confianza para cada campo extraído
export type ConfidenceLevel = 'alto' | 'medio' | 'bajo'

// Campos que se pueden extraer de una cédula
export interface ExtractedFields {
  numero_cedula: string | null
  primer_nombre: string | null
  segundo_nombre: string | null
  primer_apellido: string | null
  segundo_apellido: string | null
  fecha_nacimiento: string | null // Formato YYYY-MM-DD
  fecha_expedicion_documento: string | null // Formato YYYY-MM-DD
}

// Niveles de confianza para cada campo
export interface FieldConfidence {
  numero_cedula: ConfidenceLevel
  primer_nombre: ConfidenceLevel
  segundo_nombre: ConfidenceLevel
  primer_apellido: ConfidenceLevel
  segundo_apellido: ConfidenceLevel
  fecha_nacimiento: ConfidenceLevel
  fecha_expedicion_documento: ConfidenceLevel
}

// Respuesta completa de la Edge Function
export interface OCRResponse {
  success: boolean
  fields: ExtractedFields
  confidence: FieldConfidence
  error?: string
  debug?: {
    detectedText: string
    processingTime: number
    documentType: 'frente' | 'dorso' | 'completo' | 'desconocido'
  }
}

// Request que recibe la Edge Function
export interface OCRRequest {
  files: {
    name: string
    data: string // Base64
    type: string // MIME type
  }[]
}

// Resultado del procesamiento de Google Vision
export interface VisionResult {
  text: string
  confidence: number
}

// Resultado del parser de cédulas
export interface ParseResult {
  fields: ExtractedFields
  confidence: FieldConfidence
  documentType: 'frente' | 'dorso' | 'completo' | 'desconocido'
}

// Configuración para el parser
export interface ParserConfig {
  strictMode: boolean // Si es true, requiere mayor precisión
  debugMode: boolean // Si es true, incluye información de debug
}
