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

    console.log(`📊 [Import Guests] Processing ${lines.length - 1} rows for event ${eventIdNum}`)

    // Parse CSV (skip header)
    const guests: GuestRow[] = []
    const errorDetails: Array<{ row: number; error: string }> = []

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
          errorDetails.push({
            row: i + 1,
            error: `Linha com menos de 4 colunas (encontradas: ${values.length})`
          })
          continue
        }

        const [qrCode, name, email, phone] = values

        // Validate required fields
        if (!qrCode || !name) {
          errorDetails.push({
            row: i + 1,
            error: 'QR Code e Nome são obrigatórios'
          })
          continue
        }

        guests.push({
          qrCode: qrCode.replace(/"/g, ''),
          name: name.replace(/"/g, ''),
          email: email ? email.replace(/"/g, '') : '',
          phone: phone ? phone.replace(/"/g, '').replace(/\D/g, '') : '', // Remove non-digits
        })
      } catch (err) {
        errorDetails.push({
          row: i + 1,
          error: `Erro ao processar linha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
        })
      }
    }

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
        console.error('❌ [Import Guests] Insert error:', insertErr)
        return NextResponse.json(
          {
            error: 'Erro ao inserir convidados',
            details: insertErr.message,
            stats: {
              totalRows: lines.length - 1,
              inserted: 0,
              errors: errorDetails.length + 1,
              errorDetails: [
                ...errorDetails,
                { row: 0, error: `Erro no banco: ${insertErr.message}` }
              ]
            }
          },
          { status: 500 }
        )
      }

      console.log(`✅ [Import Guests] Successfully inserted ${guestsToInsert.length} guests`)

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
      console.error('❌ [Import Guests] Insert error:', insertError)
      return NextResponse.json(
        {
          error: 'Erro ao inserir convidados',
          details: insertError.message,
          stats: {
            totalRows: lines.length - 1,
            inserted: 0,
            errors: errorDetails.length + 1,
            errorDetails: [
              ...errorDetails,
              { row: 0, error: `Erro no banco: ${insertError.message}` }
            ]
          }
        },
        { status: 500 }
      )
    }

    console.log(`✅ [Import Guests] Successfully inserted ${guests.length} guests`)

    return NextResponse.json({
      success: true,
      message: `${guests.length} convidado(s) importado(s) com sucesso!`,
      stats: {
        totalRows: lines.length - 1,
        inserted: guests.length,
        errors: errorDetails.length,
        errorDetails
      }
    })
  } catch (error) {
    console.error('❌ [Import Guests] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar importação',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
