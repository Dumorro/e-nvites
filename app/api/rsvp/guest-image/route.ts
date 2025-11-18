import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import path from 'path'
import fs from 'fs'

// Map event IDs to folder names
const EVENT_FOLDERS: Record<number, string> = {
  1: 'oil-celebration-rj',
  2: 'oil-celebration-sp',
  7: 'festa-equinor',
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const qrCode = searchParams.get('qrCode')
    const eventId = searchParams.get('eventId')

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code é obrigatório' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID é obrigatório' },
        { status: 400 }
      )
    }

    const eventIdNum = parseInt(eventId, 10)

    console.log(`🖼️  [Guest Image] Fetching image for QR: ${qrCode}, Event: ${eventIdNum}`)

    // Try to get image from database first
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('invite_image_base64')
      .eq('qr_code', qrCode)
      .eq('event_id', eventIdNum)
      .single()

    if (!fetchError && guest?.invite_image_base64) {
      console.log(`   → Found image in database`)
      return NextResponse.json({
        success: true,
        source: 'database',
        imageData: guest.invite_image_base64,
      })
    }

    // Fallback to filesystem (for backward compatibility)
    console.log(`   → Image not in database, checking filesystem`)

    const eventSlug = EVENT_FOLDERS[eventIdNum]
    if (!eventSlug) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Try both PNG and JPG formats
    const extensions = eventIdNum === 7 ? ['png', 'jpg'] : ['jpg']

    for (const ext of extensions) {
      const imagePath = path.join(process.cwd(), 'public', 'events', eventSlug, `${qrCode}-${eventSlug}.${ext}`)
      console.log(`   → Checking path: ${imagePath}`)

      if (fs.existsSync(imagePath)) {
        // Read file and convert to base64
        const fileBuffer = fs.readFileSync(imagePath)
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
        const base64 = fileBuffer.toString('base64')
        const dataUri = `data:${mimeType};base64,${base64}`

        console.log(`   → Found image in filesystem`)
        return NextResponse.json({
          success: true,
          source: 'filesystem',
          imageData: dataUri,
        })
      }
    }

    console.log(`   → Image not found in database or filesystem`)
    return NextResponse.json(
      { error: 'Convite não encontrado' },
      { status: 404 }
    )
  } catch (error) {
    console.error('❌ [Guest Image] Error fetching image:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar imagem',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
