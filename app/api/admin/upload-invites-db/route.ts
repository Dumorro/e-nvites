import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { supabase } from '@/lib/supabase'

// Map event IDs to folder names (for matching file naming conventions)
const EVENT_FOLDERS: Record<string, string> = {
  '1': 'oil-celebration-rj',
  '2': 'oil-celebration-sp',
  '7': 'festa-equinor',
}

// Helper function to convert buffer to base64 data URI
function bufferToBase64DataUri(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

// Helper function to determine mime type from file extension
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

// Extract QR code from filename
// Expected format: {qr_code}-{event-slug}.{ext}
// Example: 3001-festa-equinor.jpg
function extractQrCodeFromFilename(filename: string, eventSlug: string): string | null {
  const pattern = new RegExp(`^([^-]+)-${eventSlug}\\.(png|jpg|jpeg)$`, 'i')
  const match = filename.match(pattern)
  return match ? match[1] : null
}

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const adminPassword = request.headers.get('x-admin-password')
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
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
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    if (!eventId || !EVENT_FOLDERS[eventId]) {
      return NextResponse.json(
        { error: 'Evento inválido' },
        { status: 400 }
      )
    }

    // Validate file is a ZIP
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser um ZIP' },
        { status: 400 }
      )
    }

    console.log(`📦 [Upload DB] Processing ZIP upload`)
    console.log(`   → File: ${file.name}`)
    console.log(`   → Size: ${file.size} bytes`)
    console.log(`   → Event ID: ${eventId}`)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract ZIP
    const zip = new AdmZip(buffer)
    const zipEntries = zip.getEntries()

    console.log(`   → ZIP contains ${zipEntries.length} files`)

    const eventFolder = EVENT_FOLDERS[eventId]
    const eventIdNum = parseInt(eventId, 10)

    let processedCount = 0
    let updatedCount = 0
    let notFoundCount = 0
    const processedFiles: string[] = []
    const notFoundFiles: string[] = []

    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const fileName = entry.entryName.split('/').pop() || entry.entryName

        // Skip hidden files and non-image files
        if (fileName.startsWith('.') || fileName.startsWith('__MACOSX')) {
          console.log(`   → Skipping: ${fileName}`)
          continue
        }

        const mimeType = getMimeType(fileName)
        if (!mimeType.startsWith('image/')) {
          console.log(`   → Skipping non-image: ${fileName}`)
          continue
        }

        // Extract QR code from filename
        const qrCode = extractQrCodeFromFilename(fileName, eventFolder)

        if (!qrCode) {
          console.log(`   ⚠️  Could not extract QR code from filename: ${fileName}`)
          notFoundCount++
          notFoundFiles.push(fileName)
          continue
        }

        console.log(`   → Processing: ${fileName} (QR: ${qrCode})`)

        // Get file buffer and convert to base64
        const fileBuffer = entry.getData()
        const base64DataUri = bufferToBase64DataUri(fileBuffer, mimeType)

        // Find guest by QR code and event ID
        const { data: guest, error: fetchError } = await supabase
          .from('guests')
          .select('id, name, qr_code')
          .eq('qr_code', qrCode)
          .eq('event_id', eventIdNum)
          .single()

        if (fetchError || !guest) {
          console.log(`   ⚠️  Guest not found for QR: ${qrCode}`)
          notFoundCount++
          notFoundFiles.push(fileName)
          continue
        }

        // Update guest with base64 image
        const { error: updateError } = await supabase
          .from('guests')
          .update({ invite_image_base64: base64DataUri })
          .eq('id', guest.id)

        if (updateError) {
          console.error(`   ❌ Error updating guest ${guest.name}:`, updateError)
          continue
        }

        console.log(`   ✅ Updated guest: ${guest.name} (${qrCode})`)
        processedCount++
        updatedCount++
        processedFiles.push(fileName)
      }
    }

    console.log(`✅ [Upload DB] Upload completed successfully`)
    console.log(`   → Processed: ${processedCount} files`)
    console.log(`   → Updated: ${updatedCount} guests`)
    console.log(`   → Not found: ${notFoundCount} files`)

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso',
      stats: {
        total: processedCount,
        updated: updatedCount,
        notFound: notFoundCount,
        files: processedFiles,
        notFoundFiles: notFoundFiles,
      },
    })
  } catch (error) {
    console.error('❌ [Upload DB] Error processing upload:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
