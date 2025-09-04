/**
 * Cliente para Google Cloud Vision API
 * Maneja la autenticación y llamadas a la API de OCR
 */

import { VisionResult } from './types.ts'

export class GoogleVisionClient {
  private projectId: string
  private credentials: any

  constructor() {
    // Obtener credenciales desde variables de entorno de Supabase
    this.projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID') || ''
    const credentialsJson = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS') || ''
    
    if (!this.projectId || !credentialsJson) {
      throw new Error('Credenciales de Google Cloud no configuradas')
    }

    try {
      this.credentials = JSON.parse(credentialsJson)
    } catch (error) {
      throw new Error('Error al parsear credenciales de Google Cloud')
    }
  }

  /**
   * Genera un token de acceso JWT para Google Cloud
   */
  private async generateAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // Token válido por 1 hora

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const payload = {
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: exp
    }

    // Crear JWT
    const encoder = new TextEncoder()
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const message = `${headerB64}.${payloadB64}`
    
    // Importar la clave privada
    const privateKey = this.credentials.private_key.replace(/\\n/g, '\n')
    const keyData = await crypto.subtle.importKey(
      'pkcs8',
      this.pemToArrayBuffer(privateKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )

    // Firmar el JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyData,
      encoder.encode(message)
    )

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const jwt = `${message}.${signatureB64}`

    // Intercambiar JWT por token de acceso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Error al obtener token de acceso: ${tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  }

  /**
   * Convierte PEM a ArrayBuffer
   */
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
    
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    return bytes.buffer
  }

  /**
   * Procesa una imagen con Google Vision API
   */
  async processImage(imageBase64: string): Promise<VisionResult> {
    try {
      console.log('🔍 Procesando imagen con Vision API...')
      console.log('📊 Longitud del base64 recibido:', imageBase64.length)
      
      // Limpiar base64 - remover prefijo data URL si existe
      let cleanBase64 = imageBase64
      if (imageBase64.includes(',')) {
        cleanBase64 = imageBase64.split(',')[1]
        console.log('🧹 Removido prefijo data URL')
      }
      
      console.log('📊 Longitud del base64 limpio:', cleanBase64.length)
      console.log('🔍 Primeros 50 caracteres:', cleanBase64.substring(0, 50))
      
      const accessToken = await this.generateAccessToken()
      console.log('🔑 Token de acceso obtenido exitosamente')
      
      const requestBody = {
        requests: [{
          image: {
            content: cleanBase64
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      }

      console.log('📤 Enviando request a Vision API...')
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      console.log('📥 Respuesta de Vision API:', response.status, response.statusText)

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('❌ Error body:', errorBody)
        throw new Error(`Vision API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.responses?.[0]?.error) {
        throw new Error(`Vision API error: ${result.responses[0].error.message}`)
      }

      const textAnnotation = result.responses?.[0]?.textAnnotations?.[0]
      
      if (!textAnnotation) {
        return {
          text: '',
          confidence: 0
        }
      }

      return {
        text: textAnnotation.description || '',
        confidence: textAnnotation.confidence || 0.5
      }

    } catch (error) {
      console.error('Error procesando imagen con Vision API:', error)
      throw new Error(`Error en Vision API: ${error.message}`)
    }
  }
}
