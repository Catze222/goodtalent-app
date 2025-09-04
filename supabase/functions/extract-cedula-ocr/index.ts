/**
 * Edge Function para extracción de datos de cédulas colombianas
 * Integra Google Vision API + Parser especializado
 * GOOD Talent - 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleVisionClient } from './googleVision.ts'
import { CedulaParser } from './cedulaParser.ts'
import { OCRRequest, OCRResponse } from './types.ts'

serve(async (req: Request) => {
  console.log('🚀 Edge Function iniciada')
  console.log('📝 Método HTTP:', req.method)
  console.log('🌐 Headers:', Object.fromEntries(req.headers.entries()))
  
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondiendo a CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Método no permitido. Use POST.' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const startTime = Date.now()
    console.log('⏱️ Tiempo de inicio:', startTime)
    
    // Verificar variables de entorno
    console.log('🔐 Verificando variables de entorno...')
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')
    const credentials = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS')
    console.log('📋 GOOGLE_CLOUD_PROJECT_ID:', projectId ? '✅ Configurado' : '❌ Falta')
    console.log('🔑 GOOGLE_APPLICATION_CREDENTIALS:', credentials ? '✅ Configurado' : '❌ Falta')
    
    // Parsear request
    let requestData: OCRRequest
    try {
      console.log('📦 Parseando request JSON...')
      requestData = await req.json()
      console.log('📊 Datos recibidos:', {
        filesCount: requestData.files?.length || 0,
        files: requestData.files?.map(f => ({
          name: f.name,
          type: f.type,
          size: f.data?.length || 0
        })) || []
      })
    } catch (error) {
      console.error('❌ Error parseando JSON:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'JSON inválido en el request' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar archivos
    if (!requestData.files || !Array.isArray(requestData.files) || requestData.files.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se enviaron archivos para procesar' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (requestData.files.length > 2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Máximo 2 archivos permitidos (frente y dorso)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar tamaño y tipo de archivos
    for (const file of requestData.files) {
      if (!file.data || !file.type) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Archivo incompleto (falta data o type)' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validar tipo MIME
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Tipo de archivo no permitido: ${file.type}. Permitidos: JPG, PNG, PDF` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validar tamaño (aproximado desde base64)
      const sizeInBytes = (file.data.length * 3) / 4
      const maxSize = 15 * 1024 * 1024 // 15MB
      if (sizeInBytes > maxSize) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Archivo muy grande. Máximo 15MB por archivo.` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Inicializar servicios
    console.log('🔧 Inicializando servicios...')
    try {
      console.log('👁️ Creando GoogleVisionClient...')
      const visionClient = new GoogleVisionClient()
      console.log('✅ GoogleVisionClient creado exitosamente')
      
      console.log('🔍 Creando CedulaParser...')
      const parser = new CedulaParser({ strictMode: false, debugMode: true })
      console.log('✅ CedulaParser creado exitosamente')

      // Procesar archivos
      console.log('📁 Iniciando procesamiento de archivos...')
      let combinedText = ''
      let allResults: string[] = []
      
      for (let i = 0; i < requestData.files.length; i++) {
        const file = requestData.files[i]
        console.log(`📄 Procesando archivo ${i + 1}/${requestData.files.length}: ${file.name}`)
        
        try {
        // Manejar PDFs - convertir primera página a imagen
        if (file.type === 'application/pdf') {
          console.log('📄 Archivo PDF detectado, procesando primera página...')
          
          try {
            // Para PDFs, asumimos que el base64 ya está listo para Vision API
            // Google Vision API puede procesar PDFs directamente
            console.log('🔍 Enviando PDF a Google Vision API...')
            const visionResult = await visionClient.processImage(file.data)
            console.log(`📝 Texto extraído del PDF (${visionResult.text.length} caracteres):`, visionResult.text.substring(0, 200) + '...')
            
            combinedText += visionResult.text + '\n\n'
            allResults.push(visionResult.text)
            console.log(`✅ PDF ${file.name} procesado exitosamente`)
            
          } catch (pdfError) {
            console.error(`❌ Error procesando PDF ${file.name}:`, pdfError)
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Error procesando PDF ${file.name}: ${pdfError.message}` 
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
          
          continue // Saltar al siguiente archivo
        }

          // Procesar imagen con Google Vision
          console.log(`🔍 Enviando a Google Vision API...`)
          const visionResult = await visionClient.processImage(file.data)
          console.log(`📝 Texto extraído (${visionResult.text.length} caracteres):`, visionResult.text.substring(0, 200) + '...')
          
          combinedText += visionResult.text + '\n\n'
          allResults.push(visionResult.text)
          console.log(`✅ Archivo ${file.name} procesado exitosamente`)
          
        } catch (error) {
          console.error(`❌ Error procesando archivo ${file.name}:`, error)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error procesando archivo ${file.name}: ${error.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

      // Parsear texto combinado
      console.log('🔍 Parseando texto combinado...')
      console.log('📄 Texto total a parsear:', combinedText.length, 'caracteres')
      
      const parseResult = parser.parse(combinedText)
      console.log('📊 Resultado del parsing:', {
        documentType: parseResult.documentType,
        fieldsFound: Object.keys(parseResult.fields).filter(key => parseResult.fields[key]).length,
        fields: parseResult.fields
      })
      
      const processingTime = Date.now() - startTime
      console.log('⏱️ Tiempo total de procesamiento:', processingTime, 'ms')

      // Construir respuesta
      console.log('📤 Construyendo respuesta final...')
      const response: OCRResponse = {
        success: true,
        fields: parseResult.fields,
        confidence: parseResult.confidence,
        debug: {
          detectedText: combinedText,
          processingTime,
          documentType: parseResult.documentType
        }
      }

      console.log('✅ Respuesta construida exitosamente')
      console.log('📊 Respuesta final:', JSON.stringify(response, null, 2))

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (serviceError) {
      console.error('❌ Error en servicios:', serviceError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error en servicios: ${serviceError.message}`,
          details: serviceError.stack
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('💥 Error general en Edge Function:', error)
    console.error('📋 Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Error interno del servidor: ${error.message}`,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
Ejemplo de uso desde el frontend:

const formData = {
  files: [
    {
      name: "cedula_frente.jpg",
      data: "base64string...",
      type: "image/jpeg"
    },
    {
      name: "cedula_dorso.jpg", 
      data: "base64string...",
      type: "image/jpeg"
    }
  ]
}

const response = await fetch('/functions/v1/extract-cedula-ocr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})

const result = await response.json()
// result.fields contiene los datos extraídos
// result.confidence contiene los niveles de confianza
*/
