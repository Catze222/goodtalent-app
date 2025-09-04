'use client'

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Tipos para el OCR
export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  data: string // base64
}

export interface ExtractedFields {
  numero_cedula: string | null
  primer_nombre: string | null
  segundo_nombre: string | null
  primer_apellido: string | null
  segundo_apellido: string | null
  fecha_nacimiento: string | null
  fecha_expedicion_documento: string | null
}

export interface FieldConfidence {
  numero_cedula: 'alto' | 'medio' | 'bajo'
  primer_nombre: 'alto' | 'medio' | 'bajo'
  segundo_nombre: 'alto' | 'medio' | 'bajo'
  primer_apellido: 'alto' | 'medio' | 'bajo'
  segundo_apellido: 'alto' | 'medio' | 'bajo'
  fecha_nacimiento: 'alto' | 'medio' | 'bajo'
  fecha_expedicion_documento: 'alto' | 'medio' | 'bajo'
}

export interface OCRResult {
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

export interface OCRState {
  loading: boolean
  result: OCRResult | null
  error: string | null
}

/**
 * Hook para manejar la extracción de datos de cédulas con OCR
 */
export function useOCRExtraction() {
  const [state, setState] = useState<OCRState>({
    loading: false,
    result: null,
    error: null
  })

  /**
   * Extrae datos de los archivos de cédula
   */
  const extractData = useCallback(async (files: UploadedFile[]) => {
    if (files.length === 0) {
      setState(prev => ({ ...prev, error: 'No hay archivos para procesar' }))
      return
    }

    setState({
      loading: true,
      result: null,
      error: null
    })

    try {
      // Preparar request para la Edge Function
      const requestData = {
        files: files.map(file => ({
          name: file.name,
          data: file.data,
          type: file.type
        }))
      }

      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('extract-cedula-ocr', {
        body: requestData
      })

      if (error) {
        throw new Error(error.message || 'Error en la Edge Function')
      }

      if (!data.success) {
        throw new Error(data.error || 'Error procesando los archivos')
      }

      setState({
        loading: false,
        result: data as OCRResult,
        error: null
      })

      return data as OCRResult

    } catch (error) {
      console.error('Error en extracción OCR:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      setState({
        loading: false,
        result: null,
        error: errorMessage
      })

      throw error
    }
  }, [])

  /**
   * Limpia el estado
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      result: null,
      error: null
    })
  }, [])

  /**
   * Obtiene los campos extraídos en formato para el formulario de contratos
   */
  const getFormFields = useCallback(() => {
    if (!state.result?.success) return null

    const fields = state.result.fields
    
    return {
      // Determinar tipo de identificación basado en el número
      tipo_identificacion: fields.numero_cedula ? (
        fields.numero_cedula.length <= 10 ? 'CC' : 'CE'
      ) : '',
      
      numero_identificacion: fields.numero_cedula || '',
      fecha_expedicion_documento: fields.fecha_expedicion_documento || '',
      primer_nombre: fields.primer_nombre || '',
      segundo_nombre: fields.segundo_nombre || '',
      primer_apellido: fields.primer_apellido || '',
      segundo_apellido: fields.segundo_apellido || '',
      fecha_nacimiento: fields.fecha_nacimiento || ''
    }
  }, [state.result])

  /**
   * Obtiene la confianza de los campos en formato para el formulario
   */
  const getFormConfidence = useCallback(() => {
    if (!state.result?.success) return null

    return {
      tipo_identificacion: state.result.confidence.numero_cedula, // Basado en el número
      numero_identificacion: state.result.confidence.numero_cedula,
      fecha_expedicion_documento: state.result.confidence.fecha_expedicion_documento,
      primer_nombre: state.result.confidence.primer_nombre,
      segundo_nombre: state.result.confidence.segundo_nombre,
      primer_apellido: state.result.confidence.primer_apellido,
      segundo_apellido: state.result.confidence.segundo_apellido,
      fecha_nacimiento: state.result.confidence.fecha_nacimiento
    }
  }, [state.result])

  return {
    // Estado
    loading: state.loading,
    result: state.result,
    error: state.error,
    
    // Acciones
    extractData,
    reset,
    
    // Helpers
    getFormFields,
    getFormConfidence
  }
}
