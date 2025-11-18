import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'

// Map event IDs to folder names
const EVENT_FOLDERS: Record<string, string> = {
  '1': 'oil-celebration-rj',
  '2': 'oil-celebration-sp',
  '7': 'festa-equinor',
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

    console.log(`📦 [Upload] Processing ZIP upload`)
    console.log(`   → File: ${file.name}`)
    console.log(`   → Size: ${file.size} bytes`)
    console.log(`   → Event ID: ${eventId}`)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Use /tmp directory for serverless environments (Vercel)
    const tempDir = '/tmp'

    // Save ZIP temporarily
    const tempZipPath = path.join(tempDir, `upload-${Date.now()}.zip`)
    await writeFile(tempZipPath, buffer)

    console.log(`   → Temp ZIP saved: ${tempZipPath}`)

    // Extract ZIP
    const zip = new AdmZip(tempZipPath)
    const zipEntries = zip.getEntries()

    console.log(`   → ZIP contains ${zipEntries.length} files`)

    // Get target directory
    const eventFolder = EVENT_FOLDERS[eventId]
    const targetDir = path.join(process.cwd(), 'public', 'events', eventFolder)

    // Create target directory if it doesn't exist
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
      console.log(`   → Created directory: ${targetDir}`)
    }

    // Get list of existing files to track what was replaced
    let existingFiles: string[] = []
    if (existsSync(targetDir)) {
      existingFiles = await readdir(targetDir)
    }

    // Extract files
    let extractedCount = 0
    let replacedCount = 0
    const extractedFiles: string[] = []

    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const fileName = path.basename(entry.entryName)
        const targetPath = path.join(targetDir, fileName)

        // Check if file exists (will be replaced)
        const fileExists = existingFiles.includes(fileName)
        if (fileExists) {
          replacedCount++
          console.log(`   → Replacing: ${fileName}`)
        } else {
          console.log(`   → Extracting: ${fileName}`)
        }

        // Extract file
        zip.extractEntryTo(entry, targetDir, false, true)
        extractedCount++
        extractedFiles.push(fileName)
      }
    }

    // Clean up temp ZIP
    await unlink(tempZipPath)
    console.log(`   → Temp ZIP removed`)

    console.log(`✅ [Upload] Upload completed successfully`)
    console.log(`   → Extracted: ${extractedCount} files`)
    console.log(`   → Replaced: ${replacedCount} files`)
    console.log(`   → New: ${extractedCount - replacedCount} files`)

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso',
      stats: {
        total: extractedCount,
        replaced: replacedCount,
        new: extractedCount - replacedCount,
        files: extractedFiles,
      },
    })
  } catch (error) {
    console.error('❌ [Upload] Error processing upload:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}
