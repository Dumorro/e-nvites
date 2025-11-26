import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

interface GuestRow {
  qrCode: string
  name: string
  email: string
  phone: string
}

interface ValidationError {
  row: number
  qrCode?: string
  name?: string
  type: 'validation' | 'parsing' | 'duplicate'
  error: string
}

interface ImportSummary {
  success: number
  skipped: number
  duplicates: number
  validationErrors: number
  parseErrors: number
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const password = request.headers.get('x-admin-password')
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID não fornecido' },
        { status: 400 }
      )
    }

    const eventIdNum = parseInt(eventId, 10)

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventIdNum)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Read CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length <= 1) {
      return NextResponse.json(
        { error: 'Arquivo CSV vazio ou apenas com cabeçalho' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    console.log(`📊 [Import Guests] Processing ${lines.length - 1} rows for event ${eventIdNum}`)
    console.log(`   File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)

    // Parse CSV (skip header)
    const guests: GuestRow[] = []
    const errorDetails: ValidationError[] = []
    const summary: ImportSummary = {
      success: 0,
      skipped: 0,
      duplicates: 0,
      validationErrors: 0,
      parseErrors: 0
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        // Parse CSV line handling quoted values
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        // Validate row has 4 columns
        if (values.length < 4) {
          summary.parseErrors++
          errorDetails.push({
            row: i + 1,
            type: 'parsing',
            error: `Linha com menos de 4 colunas (encontradas: ${values.length})`
          })
          continue
        }

        const [qrCode, name, email, phone] = values

        // Validate required fields
        if (!qrCode || !name) {
          summary.validationErrors++
          errorDetails.push({
            row: i + 1,
            qrCode: qrCode || '(vazio)',
            name: name || '(vazio)',
            type: 'validation',
            error: 'QR Code e Nome são obrigatórios'
          })
          continue
        }

        // Validate email format if provided
        if (email && email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email.trim())) {
            summary.validationErrors++
            errorDetails.push({
              row: i + 1,
              qrCode: qrCode,
              name: name,
              type: 'validation',
              error: `Email inválido: ${email}`
            })
            continue
          }
        }

        guests.push({
          qrCode: qrCode.replace(/"/g, ''),
          name: name.replace(/"/g, ''),
          email: email ? email.replace(/"/g, '') : '',
          phone: phone ? phone.replace(/"/g, '').replace(/\D/g, '') : '', // Remove non-digits
        })
      } catch (err) {
        summary.parseErrors++
        errorDetails.push({
          row: i + 1,
          type: 'parsing',
          error: `Erro ao processar linha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
        })
      }
    }

    summary.skipped = errorDetails.length
    console.log(`   → Parsed: ${guests.length} valid, ${errorDetails.length} errors`)
    console.log(`   → Breakdown: ${summary.validationErrors} validation, ${summary.parseErrors} parsing`)

    if (guests.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhum convidado válido encontrado no arquivo',
          stats: {
            totalRows: lines.length - 1,
            inserted: 0,
            errors: errorDetails.length,
            errorDetails
          }
        },
        { status: 400 }
      )
    }

    console.log(`   → Parsed ${guests.length} valid guests`)

    // Build bulk INSERT statement
    const values = guests.map(guest => {
      const guid = uuidv4()
      const emailValue = guest.email ? `'${guest.email.toLowerCase().replace(/'/g, "''")}'` : 'NULL'
      const phoneValue = guest.phone ? `'${guest.phone.replace(/'/g, "''")}'` : 'NULL'

      return `('${guest.qrCode.replace(/'/g, "''")}', '${guest.name.replace(/'/g, "''")}', ${emailValue}, ${phoneValue}, '${guid}', ${eventIdNum}, 'pending')`
    }).join(',\n  ')

    const insertQuery = `
INSERT INTO guests (qr_code, name, email, phone, guid, event_id, status) VALUES
  ${values}
`

    console.log(`   → Executing bulk INSERT for ${guests.length} guests`)
    console.log(`   → Query preview: ${insertQuery.substring(0, 200)}...`)

    // Execute bulk insert using raw SQL
    const { data, error: insertError } = await supabase.rpc('execute_sql', {
      query: insertQuery
    })

    // If execute_sql doesn't exist, use direct insert
    if (insertError && insertError.message.includes('execute_sql')) {
      console.log('   → execute_sql not available, using direct insert')

      // Fallback to Supabase client insert
      const guestsToInsert = guests.map(guest => ({
        qr_code: guest.qrCode,
        name: guest.name,
        email: guest.email ? guest.email.toLowerCase() : null,
        phone: guest.phone || null,
        guid: uuidv4(),
        event_id: eventIdNum,
        status: 'pending' as const,
      }))

      const { data: insertData, error: insertErr } = await supabase
        .from('guests')
        .insert(guestsToInsert)
        .select()

      if (insertErr) {
        const duration = Date.now() - startTime
        console.error('❌ [Import Guests] Insert error:', insertErr)
        console.error(`   Duration: ${duration}ms`)

        // Check if error is duplicate qr_code + event_id or email + event_id
        let errorMessage = insertErr.message
        let errorType: 'duplicate' | 'validation' | 'parsing' = 'validation'

        if (insertErr.code === '23505') {
          errorType = 'duplicate'
          if (insertErr.message.includes('idx_guests_qr_code_event_unique')) {
            errorMessage = 'QR Code duplicado encontrado para este evento. Cada QR Code deve ser único dentro do mesmo evento.'
          } else if (insertErr.message.includes('idx_guests_unique_email_per_event')) {
            errorMessage = 'Email duplicado encontrado para este evento. Cada email deve ser único dentro do mesmo evento.'
          } else {
            errorMessage = 'Registro duplicado encontrado. Verifique QR Codes e emails.'
          }
          summary.duplicates++
        }

        // Save failed import log to database
        const allErrors: ValidationError[] = [
          ...errorDetails,
          { row: 0, type: errorType, error: `Erro no banco: ${errorMessage}` }
        ]

        await supabase.from('import_logs').insert({
          event_id: eventIdNum,
          filename: file.name,
          total_rows: lines.length - 1,
          inserted: 0,
          errors: allErrors.length,
          error_details: {
            errors: allErrors,
            summary: {
              ...summary,
              success: 0
            },
            duration_ms: duration
          },
          status: 'failed',
          imported_by: 'admin'
        })

        return NextResponse.json(
          {
            error: 'Erro ao inserir convidados',
            details: errorMessage,
            stats: {
              totalRows: lines.length - 1,
              inserted: 0,
              errors: allErrors.length,
              errorDetails: allErrors
            }
          },
          { status: 500 }
        )
      }

      const duration = Date.now() - startTime
      summary.success = guestsToInsert.length

      console.log(`✅ [Import Guests] Successfully inserted ${guestsToInsert.length} guests`)
      console.log(`   Duration: ${duration}ms (${(duration / guestsToInsert.length).toFixed(2)}ms per guest)`)
      console.log(`   Summary: ${summary.success} success, ${summary.skipped} skipped`)

      // Save import log to database
      const importStatus = errorDetails.length > 0 ? 'partial' : 'completed'
      await supabase.from('import_logs').insert({
        event_id: eventIdNum,
        filename: file.name,
        total_rows: lines.length - 1,
        inserted: guestsToInsert.length,
        errors: errorDetails.length,
        error_details: errorDetails.length > 0 ? {
          errors: errorDetails,
          summary,
          duration_ms: duration,
          avg_time_per_guest: Number((duration / guestsToInsert.length).toFixed(2))
        } : null,
        status: importStatus,
        imported_by: 'admin'
      })

      return NextResponse.json({
        success: true,
        message: `${guestsToInsert.length} convidado(s) importado(s) com sucesso!`,
        stats: {
          totalRows: lines.length - 1,
          inserted: guestsToInsert.length,
          errors: errorDetails.length,
          errorDetails
        }
      })
    }

    if (insertError) {
      const duration = Date.now() - startTime
      console.error('❌ [Import Guests] Insert error:', insertError)
      console.error(`   Duration: ${duration}ms`)

      // Check if error is duplicate qr_code + event_id or email + event_id
      let errorMessage = insertError.message
      let errorType: 'duplicate' | 'validation' | 'parsing' = 'validation'

      if (insertError.code === '23505') {
        errorType = 'duplicate'
        if (insertError.message.includes('idx_guests_qr_code_event_unique')) {
          errorMessage = 'QR Code duplicado encontrado para este evento. Cada QR Code deve ser único dentro do mesmo evento.'
        } else if (insertError.message.includes('idx_guests_unique_email_per_event')) {
          errorMessage = 'Email duplicado encontrado para este evento. Cada email deve ser único dentro do mesmo evento.'
        } else {
          errorMessage = 'Registro duplicado encontrado. Verifique QR Codes e emails.'
        }
        summary.duplicates++
      }

      // Save failed import log to database
      const allErrors: ValidationError[] = [
        ...errorDetails,
        { row: 0, type: errorType, error: `Erro no banco: ${errorMessage}` }
      ]

      await supabase.from('import_logs').insert({
        event_id: eventIdNum,
        filename: file.name,
        total_rows: lines.length - 1,
        inserted: 0,
        errors: allErrors.length,
        error_details: {
          errors: allErrors,
          summary: {
            ...summary,
            success: 0
          },
          duration_ms: duration
        },
        status: 'failed',
        imported_by: 'admin'
      })

      return NextResponse.json(
        {
          error: 'Erro ao inserir convidados',
          details: errorMessage,
          stats: {
            totalRows: lines.length - 1,
            inserted: 0,
            errors: allErrors.length,
            errorDetails: allErrors
          }
        },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    summary.success = guests.length

    console.log(`✅ [Import Guests] Successfully inserted ${guests.length} guests`)
    console.log(`   Duration: ${duration}ms (${(duration / guests.length).toFixed(2)}ms per guest)`)
    console.log(`   Summary: ${summary.success} success, ${summary.skipped} skipped`)

    // Save import log to database
    const importStatus = errorDetails.length > 0 ? 'partial' : 'completed'
    await supabase.from('import_logs').insert({
      event_id: eventIdNum,
      filename: file.name,
      total_rows: lines.length - 1,
      inserted: guests.length,
      errors: errorDetails.length,
      error_details: errorDetails.length > 0 ? {
        errors: errorDetails,
        summary,
        duration_ms: duration,
        avg_time_per_guest: Number((duration / guests.length).toFixed(2))
      } : null,
      status: importStatus,
      imported_by: 'admin'
    })

    return NextResponse.json({
      success: true,
      message: `${guests.length} convidado(s) importado(s) com sucesso!`,
      stats: {
        totalRows: lines.length - 1,
        inserted: guests.length,
        errors: errorDetails.length,
        errorDetails,
        summary,
        duration: duration
      }
    })
  } catch (error) {
    console.error('❌ [Import Guests] Critical Error:', error)
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace')

    // Try to log the error to database
    try {
      await supabase.from('import_logs').insert({
        event_id: null,
        filename: 'unknown',
        total_rows: 0,
        inserted: 0,
        errors: 1,
        error_details: {
          errors: [{
            row: 0,
            type: 'parsing',
            error: `Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }],
          stack: error instanceof Error ? error.stack : undefined
        },
        status: 'failed',
        imported_by: 'admin'
      })
    } catch (logError) {
      console.error('❌ Failed to log error to database:', logError)
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar importação',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
