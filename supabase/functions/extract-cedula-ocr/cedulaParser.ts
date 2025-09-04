/**
 * Parser especializado para cédulas colombianas y de extranjería
 * Extrae campos específicos usando regex y heurísticas
 */

import { ExtractedFields, FieldConfidence, ConfidenceLevel, ParseResult, ParserConfig } from './types.ts'

export class CedulaParser {
  private config: ParserConfig

  constructor(config: ParserConfig = { strictMode: false, debugMode: false }) {
    this.config = config
  }

  /**
   * Procesa el texto extraído por OCR y extrae los campos de la cédula
   */
  parse(text: string): ParseResult {
    const cleanText = this.cleanText(text)
    const documentType = this.detectDocumentType(cleanText)
    
    const fields: ExtractedFields = {
      numero_cedula: null,
      primer_nombre: null,
      segundo_nombre: null,
      primer_apellido: null,
      segundo_apellido: null,
      fecha_nacimiento: null,
      fecha_expedicion_documento: null
    }

    const confidence: FieldConfidence = {
      numero_cedula: 'bajo',
      primer_nombre: 'bajo',
      segundo_nombre: 'bajo',
      primer_apellido: 'bajo',
      segundo_apellido: 'bajo',
      fecha_nacimiento: 'bajo',
      fecha_expedicion_documento: 'bajo'
    }

    // Extraer campos según el tipo de documento
    if (documentType === 'frente' || documentType === 'completo') {
      this.extractFrontalFields(cleanText, fields, confidence)
    }
    
    if (documentType === 'dorso' || documentType === 'completo') {
      this.extractBackFields(cleanText, fields, confidence)
    }

    return {
      fields,
      confidence,
      documentType
    }
  }

  /**
   * Limpia y normaliza el texto OCR
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  /**
   * Detecta si es frente, dorso o documento completo
   */
  private detectDocumentType(text: string): 'frente' | 'dorso' | 'completo' | 'desconocido' {
    console.log('🔍 Detectando tipo de documento...')
    console.log('📄 Texto a analizar:', text.substring(0, 200) + '...')
    
    const frontalIndicators = [
      'REPÚBLICA DE COLOMBIA',
      'CEDULA DE CIUDADANIA',
      'CEDULA DE EXTRANJERIA',
      'APELLIDOS',
      'NOMBRES',
      'NUMERO', // Número de cédula en el frente
      'IDENTIFICACION PERSONAL'
    ]

    const backIndicators = [
      'FECHA DE NACIMIENTO',
      'LUGAR DE NACIMIENTO', 
      'FECHA Y LUGAR DE EXPEDICION',
      'GRUPO SANGUINEO',
      'ESTATURA',
      'CUNDINAMARCA', // Lugares comunes en el dorso
      'BOGOTA'
    ]

    const frontalCount = frontalIndicators.filter(indicator => text.includes(indicator)).length
    const backCount = backIndicators.filter(indicator => text.includes(indicator)).length
    
    console.log(`📊 Indicadores frontales: ${frontalCount}, Indicadores dorso: ${backCount}`)

    if (frontalCount >= 2 && backCount >= 2) {
      console.log('✅ Documento completo detectado')
      return 'completo'
    }
    if (frontalCount >= 2) {
      console.log('✅ Frente detectado')
      return 'frente'
    }
    if (backCount >= 2) {
      console.log('✅ Dorso detectado')
      return 'dorso'
    }
    
    console.log('❌ Tipo de documento desconocido')
    return 'desconocido'
  }

  /**
   * Extrae campos del frente de la cédula
   */
  private extractFrontalFields(text: string, fields: ExtractedFields, confidence: FieldConfidence): void {
    // Extraer número de cédula
    const cedulaMatch = this.extractCedulaNumber(text)
    if (cedulaMatch.value) {
      fields.numero_cedula = cedulaMatch.value
      confidence.numero_cedula = cedulaMatch.confidence
    }

    // Extraer apellidos y nombres
    const namesMatch = this.extractNames(text)
    console.log('📊 Resultado de extracción de nombres:', namesMatch)
    
    if (namesMatch.apellidos.length > 0) {
      fields.primer_apellido = namesMatch.apellidos[0]
      confidence.primer_apellido = namesMatch.confidence
      
      if (namesMatch.apellidos.length > 1) {
        fields.segundo_apellido = namesMatch.apellidos[1]
        confidence.segundo_apellido = namesMatch.confidence
      }
      
      console.log('✅ Apellidos asignados:', {
        primer_apellido: fields.primer_apellido,
        segundo_apellido: fields.segundo_apellido
      })
    }

    if (namesMatch.nombres.length > 0) {
      fields.primer_nombre = namesMatch.nombres[0]
      confidence.primer_nombre = namesMatch.confidence
      
      if (namesMatch.nombres.length > 1) {
        fields.segundo_nombre = namesMatch.nombres[1]
        confidence.segundo_nombre = namesMatch.confidence
      }
      
      console.log('✅ Nombres asignados:', {
        primer_nombre: fields.primer_nombre,
        segundo_nombre: fields.segundo_nombre
      })
    }
  }

  /**
   * Extrae campos del dorso de la cédula
   */
  private extractBackFields(text: string, fields: ExtractedFields, confidence: FieldConfidence): void {
    // Extraer fecha de nacimiento
    const birthDateMatch = this.extractBirthDate(text)
    if (birthDateMatch.value) {
      fields.fecha_nacimiento = birthDateMatch.value
      confidence.fecha_nacimiento = birthDateMatch.confidence
    }

    // Extraer fecha de expedición
    const expeditionDateMatch = this.extractExpeditionDate(text)
    if (expeditionDateMatch.value) {
      fields.fecha_expedicion_documento = expeditionDateMatch.value
      confidence.fecha_expedicion_documento = expeditionDateMatch.confidence
    }
  }

  /**
   * Extrae el número de cédula
   */
  private extractCedulaNumber(text: string): { value: string | null, confidence: ConfidenceLevel } {
    console.log('🔍 Buscando número de cédula en texto...')
    
    // Patrones universales para números de cédula colombiana
    const patterns = [
      /NUIP\s*(\d{1,3}(?:\.\d{3})*\.\d{3})/gi, // Formato nuevo: NUIP 1.234.567.890
      /NUMERO\s+(\d{1,3}(?:\.\d{3})*\.\d{3})/gi, // Formato: NUMERO 1.020.742.434
      /NO\.?\s*(\d{1,3}(?:\.\d{3})*\.\d{3})/gi, // Formato: No. 1.234.567.890
      /NO\.\s*(\d{2}\.\d{3}\.\d{3})/gi, // Formato antiguo: NO. 20.000.001
      /(?:CEDULA|CC|CE)\s*:?\s*(\d{1,3}(?:\.\d{3})*\.\d{3})/gi, // Formato: CEDULA: 1.234.567.890
      /(\d{1,3}\.\d{3}\.\d{3})/g, // Formato directo: 1.020.742.434
      /(\d{2}\.\d{3}\.\d{3})/g, // Formato directo antiguo: 20.000.001
      /(\d{8,10})/g // Formato: números de 8-10 dígitos sin puntos
    ]

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      const matches = Array.from(text.matchAll(pattern))
      console.log(`📊 Patrón ${i + 1} encontró ${matches.length} coincidencias`)
      
      for (const match of matches) {
        const rawNumber = match[1] || match[0]
        const number = rawNumber.replace(/\./g, '').replace(/\s/g, '')
        console.log(`🔢 Evaluando número: ${rawNumber} → ${number}`)
        
        if (this.isValidCedulaNumber(number)) {
          const confidence = i < 2 ? 'alto' : i < 4 ? 'medio' : 'bajo'
          console.log(`✅ Número válido encontrado: ${number} (confianza: ${confidence})`)
          return {
            value: number,
            confidence
          }
        }
      }
    }

    console.log('❌ No se encontró número de cédula válido')
    return { value: null, confidence: 'bajo' }
  }

  /**
   * Valida si un número de cédula es válido
   */
  private isValidCedulaNumber(number: string): boolean {
    // Longitud válida (8-10 dígitos)
    if (number.length < 8 || number.length > 10) return false
    
    // Solo números
    if (!/^\d+$/.test(number)) return false
    
    // No puede ser todos ceros o números repetidos
    if (/^(\d)\1+$/.test(number)) return false
    
    return true
  }

  /**
   * Extrae apellidos y nombres con estrategia simplificada pero robusta
   */
  private extractNames(text: string): { 
    apellidos: string[], 
    nombres: string[], 
    confidence: ConfidenceLevel 
  } {
    console.log('👤 Extrayendo nombres y apellidos...')
    console.log('📄 Texto completo a analizar:', text)

    const result = { apellidos: [] as string[], nombres: [] as string[], confidence: 'bajo' as ConfidenceLevel }

    // Estrategia 1: Patrones ordenados por prioridad y especificidad
    const strategies = [
      () => this.extractNamesStrategy1(text), // Tu cédula específica
      () => this.extractNamesStrategy2(text), // Formato nuevo
      () => this.extractNamesStrategy3(text), // Formato antiguo
      () => this.extractNamesStrategy4(text)  // Genérico
    ]

    for (let i = 0; i < strategies.length; i++) {
      console.log(`🔄 Probando estrategia ${i + 1}...`)
      const strategyResult = strategies[i]()
      
      if (strategyResult.apellidos.length > 0 || strategyResult.nombres.length > 0) {
        console.log(`✅ Estrategia ${i + 1} exitosa:`, strategyResult)
        return strategyResult
      }
    }

    console.log(`❌ Ninguna estrategia funcionó`)
    return result
  }

  /**
   * Estrategia 1: Específica para tu cédula (NUMERO ... APELLIDOS ... NOMBRES)
   */
  private extractNamesStrategy1(text: string): { apellidos: string[], nombres: string[], confidence: ConfidenceLevel } {
    console.log('🎯 Estrategia 1: Formato específico NUMERO-APELLIDOS-NOMBRES')
    
    const result = { apellidos: [] as string[], nombres: [] as string[], confidence: 'bajo' as ConfidenceLevel }

    // Buscar patrón: NUMERO 1.020.742.434 CANAL SCHLESINGER APELLIDOS JAIME NOMBRES
    const fullMatch = text.match(/NUMERO\s+\d{1,3}(?:\.\d{3})*\.\d{3}\s+([A-ZÁÉÍÓÚÑ\s]+?)\s+APELLIDOS\s+([A-ZÁÉÍÓÚÑ\s]+?)\s+NOMBRES/i)
    
    if (fullMatch) {
      result.apellidos = this.splitNames(fullMatch[1].trim())
      result.nombres = this.splitNames(fullMatch[2].trim())
      result.confidence = 'alto'
      console.log('✅ Patrón completo encontrado:', { apellidos: result.apellidos, nombres: result.nombres })
      return result
    }

    // Fallback: buscar por partes
    const apellidosMatch = text.match(/(?:NUMERO\s+\d{1,3}(?:\.\d{3})*\.\d{3}\s+)([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*APELLIDOS)/i)
    if (apellidosMatch) {
      result.apellidos = this.splitNames(apellidosMatch[1].trim())
      console.log('✅ Apellidos encontrados:', result.apellidos)
    }

    const nombresMatch = text.match(/APELLIDOS\s+[A-ZÁÉÍÓÚÑ\s]+?\s+([A-ZÁÉÍÓÚÑ\s]+?)\s+NOMBRES/i)
    if (nombresMatch) {
      result.nombres = this.splitNames(nombresMatch[1].trim())
      result.confidence = result.apellidos.length > 0 ? 'alto' : 'medio'
      console.log('✅ Nombres encontrados:', result.nombres)
    }

    return result
  }

  /**
   * Estrategia 2: Formato nuevo (Apellidos ... Nombres ...)
   */
  private extractNamesStrategy2(text: string): { apellidos: string[], nombres: string[], confidence: ConfidenceLevel } {
    console.log('🆕 Estrategia 2: Formato nuevo')
    
    const result = { apellidos: [] as string[], nombres: [] as string[], confidence: 'bajo' as ConfidenceLevel }
    
    const apellidosMatch = text.match(/Apellidos\s+([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*Nombres|\s*Nacionalidad|\s*$)/i)
    if (apellidosMatch) {
      result.apellidos = this.splitNames(apellidosMatch[1].trim())
      result.confidence = 'alto'
    }

    const nombresMatch = text.match(/Nombres\s+([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*Nacionalidad|\s*Sexo|\s*$)/i)
    if (nombresMatch) {
      result.nombres = this.splitNames(nombresMatch[1].trim())
      result.confidence = result.confidence === 'alto' ? 'alto' : 'medio'
    }

    return result
  }

  /**
   * Estrategia 3: Formato antiguo (APELLIDOS: ... NOMBRES: ...)
   */
  private extractNamesStrategy3(text: string): { apellidos: string[], nombres: string[], confidence: ConfidenceLevel } {
    console.log('🏛️ Estrategia 3: Formato antiguo')
    
    const result = { apellidos: [] as string[], nombres: [] as string[], confidence: 'bajo' as ConfidenceLevel }
    
    const apellidosMatch = text.match(/APELLIDOS[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*NOMBRES|\s*NACIDO|\s*$)/i)
    if (apellidosMatch) {
      result.apellidos = this.splitNames(apellidosMatch[1].trim())
      result.confidence = 'alto'
    }

    const nombresMatch = text.match(/NOMBRES[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*NACIDO|\s*NO\.|$)/i)
    if (nombresMatch) {
      result.nombres = this.splitNames(nombresMatch[1].trim())
      result.confidence = result.confidence === 'alto' ? 'alto' : 'medio'
    }

    return result
  }

  /**
   * Estrategia 4: Genérica (cualquier patrón APELLIDOS/NOMBRES)
   */
  private extractNamesStrategy4(text: string): { apellidos: string[], nombres: string[], confidence: ConfidenceLevel } {
    console.log('🌐 Estrategia 4: Genérica')
    
    const result = { apellidos: [] as string[], nombres: [] as string[], confidence: 'bajo' as ConfidenceLevel }
    
    // Buscar cualquier mención de apellidos/nombres
    const apellidosPatterns = [
      /APELLIDOS[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*NOMBRES|\s*$)/gi,
      /Apellidos[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*Nombres|\s*$)/gi
    ]

    const nombresPatterns = [
      /NOMBRES[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*FIRMA|\s*$)/gi,
      /Nombres[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*$)/gi
    ]

    for (const pattern of apellidosPatterns) {
      const match = pattern.exec(text)
      if (match && match[1].trim()) {
        result.apellidos = this.splitNames(match[1].trim())
        result.confidence = 'medio'
        break
      }
    }

    for (const pattern of nombresPatterns) {
      const match = pattern.exec(text)
      if (match && match[1].trim()) {
        result.nombres = this.splitNames(match[1].trim())
        result.confidence = result.confidence === 'medio' ? 'medio' : 'bajo'
        break
      }
    }

    return result
  }



  /**
   * Divide una cadena de nombres en partes individuales
   */
  private splitNames(namesString: string): string[] {
    return namesString
      .trim()
      .split(/\s+/)
      .filter(name => name.length > 1)
      .map(name => this.capitalizeFirst(name))
      .slice(0, 2) // Máximo 2 nombres/apellidos
  }

  /**
   * Capitaliza solo la primera letra
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * Extrae fecha de nacimiento
   */
  private extractBirthDate(text: string): { value: string | null, confidence: ConfidenceLevel } {
    console.log('📅 Extrayendo fecha de nacimiento...')
    console.log('🔍 Texto completo para buscar fecha nacimiento:', text)
    console.log('🔍 Buscando patrones de NACIMIENTO en:', text.includes('NACIMIENTO') ? 'SÍ' : 'NO')
    console.log('🔍 Buscando patrones de FECHA DE NACIMIENTO en:', text.includes('FECHA DE NACIMIENTO') ? 'SÍ' : 'NO')
    
    const patterns = [
      // Formatos específicos con contexto claro de NACIMIENTO (alta prioridad)
      /FECHA\s+DE\s+NACIMIENTO\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/gi, // FECHA DE NACIMIENTO 15 ABR 2004
      /Fecha\s+de\s+nacimiento\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/gi,
      /FECHA\s+DE\s+NACIMIENTO\s+(\d{1,2})-([A-Z]{3})-(\d{4})/gi, // FECHA DE NACIMIENTO 09-JUN-1989
      /NACIMIENTO\s+(\d{1,2})-([A-Z]{3})-(\d{4})/gi,
      
      // Formatos más flexibles con espacios variables
      /FECHA\s*DE\s*NACIMIENTO[:\s]*(\d{1,2})\s*-?\s*([A-Z]{3})\s*-?\s*(\d{4})/gi,
      /NACIMIENTO[:\s]*(\d{1,2})\s*-?\s*([A-Z]{3})\s*-?\s*(\d{4})/gi,
      
      // Formatos antiguos con meses completos
      /NACIDO[:\s]+(\d{1,2})-([a-z]+)-(\d{2,4})/gi, // NACIDO: 25-enero-1905
      
      // Formatos numéricos con contexto específico
      /FECHA\s+DE\s+NACIMIENTO:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
      /NACIMIENTO:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
      
      // Patrones más agresivos para capturar fechas en formato típico de cédula
      /(\d{1,2})\s*-\s*([A-Z]{3})\s*-\s*(\d{4})/g, // 09-JUN-1989 (formato directo)
      /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/g, // 09 JUN 1989 (con espacios)
      
      // Último recurso: cualquier fecha que no esté cerca de palabras de expedición
      /(?<!EXPEDICION.{0,50})(\d{1,2})-([A-Z]{3})-(\d{4})(?!.{0,50}EXPEDICION)/gi
    ]

    // Mapeo de meses en español (abreviados y completos)
    const monthMap: Record<string, string> = {
      // Abreviados
      'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12',
      // Completos
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
      // Variantes
      'Mayo': '05'
    }

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      const match = pattern.exec(text)
      if (match) {
        console.log(`📅 Patrón ${i + 1} encontró fecha nacimiento:`, match[0])
        
        let day: string, month: string, year: string
        
        if (i < 7) {
          // Formatos con contexto de NACIMIENTO (alta confianza)
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || monthMap[match[2].toLowerCase()] || '01'
          year = match[3]
          
          // Para años de 2 dígitos, convertir a 4 dígitos
          if (year.length === 2) {
            const yearNum = parseInt(year)
            year = yearNum > 50 ? `19${year}` : `20${year}`
          }
        } else if (i < 9) {
          // Formato numérico con contexto específico
          day = match[1].padStart(2, '0')
          month = match[2].padStart(2, '0')
          year = match[3]
        } else if (i < 11) {
          // Patrones más agresivos (formato directo)
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || '01'
          year = match[3]
        } else {
          // Último recurso con lookbehind/lookahead
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || '01'
          year = match[3]
        }
        
        console.log(`📅 Fecha nacimiento procesada: ${day}/${month}/${year}`)
        
        if (this.isValidDate(day, month, year)) {
          // Confianza basada en especificidad del patrón
          let confidence: ConfidenceLevel
          if (i < 4) confidence = 'alto' // Patrones con contexto específico de NACIMIENTO
          else if (i < 7) confidence = 'medio' // Patrones flexibles con contexto
          else if (i < 9) confidence = 'medio' // Patrones numéricos con contexto
          else if (i < 11) confidence = 'bajo' // Patrones agresivos sin contexto
          else confidence = 'bajo' // Último recurso
          console.log(`✅ Fecha nacimiento válida: ${year}-${month}-${day} (confianza: ${confidence})`)
          return {
            value: `${year}-${month}-${day}`,
            confidence
          }
        }
      }
    }

    console.log('❌ No se encontró fecha de nacimiento con patrones específicos')
    
    // Fallback: buscar todas las fechas y elegir la más probable como nacimiento
    console.log('🔄 Intentando fallback: buscar todas las fechas...')
    return this.findBirthDateFallback(text)
  }

  /**
   * Método fallback para encontrar fecha de nacimiento analizando todas las fechas
   */
  private findBirthDateFallback(text: string): { value: string | null, confidence: ConfidenceLevel } {
    console.log('🔍 Fallback: Buscando todas las fechas en el texto...')
    
    // Buscar todas las fechas posibles en el texto
    const allDatePatterns = [
      /(\d{1,2})\s*-\s*([A-Z]{3})\s*-\s*(\d{4})/g, // 09-JUN-1989
      /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/g, // 09 JUN 1989
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g // 09/06/1989
    ]
    
    const foundDates: Array<{date: string, year: number, confidence: ConfidenceLevel, raw: string}> = []
    
    const monthMap: Record<string, string> = {
      'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
    }
    
    for (const pattern of allDatePatterns) {
      const matches = Array.from(text.matchAll(pattern))
      for (const match of matches) {
        let day: string, month: string, year: string
        
        if (pattern.source.includes('[A-Z]{3}')) {
          // Formato con mes en letras
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || '01'
          year = match[3]
        } else {
          // Formato numérico
          day = match[1].padStart(2, '0')
          month = match[2].padStart(2, '0')
          year = match[3]
        }
        
        if (this.isValidDate(day, month, year)) {
          const yearNum = parseInt(year)
          const dateStr = `${year}-${month}-${day}`
          
          // Determinar confianza basada en contexto
          let confidence: ConfidenceLevel = 'bajo'
          const context = text.substring(Math.max(0, match.index! - 50), match.index! + match[0].length + 50)
          
          if (context.includes('EXPEDICION') || context.includes('LUGAR')) {
            continue // Skip fechas de expedición
          }
          
          if (context.includes('NACIMIENTO')) {
            confidence = 'alto'
          } else if (yearNum < 2010) { // Fechas más antiguas son más probables de ser nacimiento
            confidence = 'medio'
          }
          
          foundDates.push({
            date: dateStr,
            year: yearNum,
            confidence,
            raw: match[0]
          })
          
          console.log(`📅 Fecha encontrada: ${dateStr} (${match[0]}) - Confianza: ${confidence}`)
        }
      }
    }
    
    if (foundDates.length === 0) {
      console.log('❌ No se encontraron fechas válidas en fallback')
      return { value: null, confidence: 'bajo' }
    }
    
    // Ordenar por: 1) Confianza, 2) Año más antiguo (más probable ser nacimiento)
    foundDates.sort((a, b) => {
      const confidenceOrder = { 'alto': 3, 'medio': 2, 'bajo': 1 }
      if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
      }
      return a.year - b.year // Año más antiguo primero
    })
    
    const bestDate = foundDates[0]
    console.log(`✅ Fecha de nacimiento seleccionada por fallback: ${bestDate.date} (confianza: ${bestDate.confidence})`)
    
    return {
      value: bestDate.date,
      confidence: bestDate.confidence
    }
  }

  /**
   * Extrae fecha de expedición
   */
  private extractExpeditionDate(text: string): { value: string | null, confidence: ConfidenceLevel } {
    console.log('📅 Extrayendo fecha de expedición...')
    console.log('📄 Texto para analizar expedición:', text)
    
    const patterns = [
      // Formatos específicos con FECHA Y LUGAR DE EXPEDICION (alta prioridad)
      /FECHA\s+Y\s+LUGAR\s+DE\s+EXPEDICION\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/gi, // FECHA Y LUGAR DE EXPEDICION 20 ABR 2022
      /Fecha\s+y\s+lugar\s+de\s+expedicion\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/gi,
      /FECHA\s+Y\s+LUGAR\s+DE\s+EXPEDICION\s+(\d{1,2})-([A-Z]{3})-(\d{4})/gi, // FECHA Y LUGAR DE EXPEDICION 14-JUN-2007
      
      // Formatos con contexto de lugar/ciudad (media prioridad)
      /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+([A-Z\s]{2,})\s+D\.?C\.?/gi, // 20 ABR 2022 BOGOTA D.C
      /(\d{1,2})-([A-Z]{3})-(\d{4})\s+([A-Z\s]{2,})/gi, // 14-JUN-2007 BOGOTA
      /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+[A-Z]{2,}/gi, // 20 ABR 2022 CARTAGENA
      
      // Formatos con palabra EXPEDICION específica
      /(?:LUGAR\s+DE\s+)?EXPEDICION\s+(\d{1,2})-([A-Z]{3})-(\d{4})/gi,
      /EXPEDICION\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/gi,
      
      // Formatos antiguos con contexto de lugar
      /(\d{1,2})-([a-z]+)-(\d{2,4})\s+LUGAR[:\s]+[A-Z]+/gi, // 25-Mayo-56 LUGAR: BOGOTA
      
      // Formatos numéricos con contexto específico de expedición
      /FECHA\s+DE\s+EXPEDICION:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
      /EXPEDICION:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi
    ]

    // Mapeo de meses en español (abreviados y completos)
    const monthMap: Record<string, string> = {
      // Abreviados
      'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12',
      // Completos
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
      // Variantes
      'Mayo': '05'
    }

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      const match = pattern.exec(text)
      if (match) {
        console.log(`📅 Patrón ${i + 1} encontró fecha expedición:`, match[0])
        
        let day: string, month: string, year: string
        
        if (i < 3) {
          // Formatos específicos con "FECHA Y LUGAR DE EXPEDICION" (máxima confianza)
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || '01'
          year = match[3]
        } else if (i < 6) {
          // Formatos con contexto de lugar/ciudad (buena confianza)
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || '01'
          year = match[3]
        } else if (i < 9) {
          // Formatos con palabra EXPEDICION específica (media confianza)
          day = match[1].padStart(2, '0')
          month = monthMap[match[2].toUpperCase()] || monthMap[match[2].toLowerCase()] || '01'
          year = match[3]
          
          // Para años de 2 dígitos, convertir a 4 dígitos
          if (year.length === 2) {
            const yearNum = parseInt(year)
            year = yearNum > 50 ? `19${year}` : `20${year}`
          }
        } else {
          // Formato numérico con contexto específico
          day = match[1].padStart(2, '0')
          month = match[2].padStart(2, '0')
          year = match[3]
        }
        
        console.log(`📅 Fecha expedición procesada: ${day}/${month}/${year}`)
        
        if (this.isValidDate(day, month, year)) {
          // Asignar confianza basada en especificidad del patrón
          let confidence: ConfidenceLevel
          if (i < 3) confidence = 'alto' // Patrones con "FECHA Y LUGAR DE EXPEDICION"
          else if (i < 6) confidence = 'alto' // Patrones con contexto de ciudad
          else if (i < 9) confidence = 'medio' // Patrones con "EXPEDICION"
          else confidence = 'medio' // Patrones numéricos con contexto
          
          console.log(`✅ Fecha expedición válida: ${year}-${month}-${day} (confianza: ${confidence})`)
          return {
            value: `${year}-${month}-${day}`,
            confidence
          }
        }
      }
    }

    console.log('❌ No se encontró fecha de expedición válida')
    return { value: null, confidence: 'bajo' }
  }

  /**
   * Valida si una fecha es válida
   */
  private isValidDate(day: string, month: string, year: string): boolean {
    const d = parseInt(day)
    const m = parseInt(month)
    const y = parseInt(year)
    
    if (y < 1900 || y > new Date().getFullYear()) return false
    if (m < 1 || m > 12) return false
    if (d < 1 || d > 31) return false
    
    // Validación básica de días por mes
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (d > daysInMonth[m - 1]) {
      // Verificar año bisiesto para febrero
      if (m === 2 && d === 29) {
        return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)
      }
      return false
    }
    
    return true
  }
}
