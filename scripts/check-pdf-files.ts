/**
 * Script para verificar quais PDFs estão faltando para os convidados
 *
 * Executa com: npx tsx scripts/check-pdf-files.ts
 */

import { supabase } from '../lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function checkPdfFiles() {
  console.log('🔍 Verificando PDFs dos convidados...\n')

  try {
    // Buscar todos os convidados com seus eventos
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, name, email, qr_code, event_id, events(name)')
      .order('event_id')
      .order('name')

    if (error) {
      console.error('❌ Erro ao buscar convidados:', error)
      return
    }

    if (!guests || guests.length === 0) {
      console.log('⚠️  Nenhum convidado encontrado no banco de dados')
      return
    }

    console.log(`📊 Total de convidados: ${guests.length}\n`)

    const rioGuests = guests.filter(g => g.event_id === 1)
    const spGuests = guests.filter(g => g.event_id === 2)

    // Verificar PDFs do Rio
    console.log('🏖️  EVENTO RIO DE JANEIRO')
    console.log('=' .repeat(60))
    checkEventPdfs(rioGuests, 'rio')

    console.log('\n')

    // Verificar PDFs de São Paulo
    console.log('🌆 EVENTO SÃO PAULO')
    console.log('='.repeat(60))
    checkEventPdfs(spGuests, 'saopaulo')

    // Estatísticas gerais
    console.log('\n📈 ESTATÍSTICAS GERAIS')
    console.log('='.repeat(60))

    const withQrCode = guests.filter(g => g.qr_code).length
    const withoutQrCode = guests.length - withQrCode

    console.log(`✅ Convidados com QR Code: ${withQrCode}`)
    console.log(`❌ Convidados sem QR Code: ${withoutQrCode}`)

    if (withoutQrCode > 0) {
      console.log('\n⚠️  Convidados sem QR Code:')
      guests.filter(g => !g.qr_code).forEach(g => {
        const eventName = g.event_id === 1 ? 'Rio' : 'São Paulo'
        console.log(`   - ID ${g.id}: ${g.name} (${eventName})`)
      })
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

function checkEventPdfs(guests: any[], folder: string) {
  const publicPath = path.join(process.cwd(), 'public', 'events', folder)

  // Verificar se a pasta existe
  if (!fs.existsSync(publicPath)) {
    console.log(`❌ Pasta não encontrada: public/events/${folder}/`)
    console.log(`   Crie a pasta com: mkdir -p public/events/${folder}`)
    return
  }

  // Listar arquivos na pasta
  const files = fs.readdirSync(publicPath).filter(f => f.endsWith('.pdf'))
  console.log(`📁 Total de PDFs na pasta: ${files.length}`)
  console.log(`👥 Total de convidados: ${guests.length}\n`)

  const guestsWithQrCode = guests.filter(g => g.qr_code)
  const guestsWithoutQrCode = guests.filter(g => !g.qr_code)

  if (guestsWithoutQrCode.length > 0) {
    console.log(`⚠️  ${guestsWithoutQrCode.length} convidado(s) sem QR Code:`)
    guestsWithoutQrCode.forEach(g => {
      console.log(`   - ID ${g.id}: ${g.name} (${g.email})`)
    })
    console.log()
  }

  // Verificar PDFs faltando
  const missingPdfs: any[] = []
  const foundPdfs: any[] = []

  guestsWithQrCode.forEach(guest => {
    const pdfFileName = `${guest.qr_code}.pdf`
    const pdfPath = path.join(publicPath, pdfFileName)

    if (fs.existsSync(pdfPath)) {
      foundPdfs.push(guest)
    } else {
      missingPdfs.push(guest)
    }
  })

  console.log(`✅ PDFs encontrados: ${foundPdfs.length}/${guestsWithQrCode.length}`)

  if (missingPdfs.length > 0) {
    console.log(`\n❌ PDFs FALTANDO (${missingPdfs.length}):`)
    missingPdfs.forEach(g => {
      console.log(`   - ${g.qr_code}.pdf para ${g.name} (ID: ${g.id})`)
      console.log(`     Deve estar em: public/events/${folder}/${g.qr_code}.pdf`)
    })
  } else {
    console.log('🎉 Todos os PDFs estão presentes!')
  }

  // Verificar PDFs extras (que não correspondem a nenhum convidado)
  const qrCodes = new Set(guestsWithQrCode.map(g => g.qr_code))
  const extraPdfs = files.filter(f => {
    const qrCode = f.replace('.pdf', '')
    return !qrCodes.has(qrCode)
  })

  if (extraPdfs.length > 0) {
    console.log(`\n⚠️  PDFs extras sem convidado correspondente (${extraPdfs.length}):`)
    extraPdfs.forEach(f => {
      console.log(`   - ${f}`)
    })
  }
}

// Executar o script
checkPdfFiles()
