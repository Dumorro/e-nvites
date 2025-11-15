/**
 * Script para gerar QR codes para convidados que não têm
 *
 * Executa com: npx tsx scripts/generate-qr-codes.ts
 *
 * Opções:
 * - use-guid: Usa o GUID como QR code
 * - sequential: Gera códigos sequenciais (90001, 90002, etc.)
 */

import { supabase } from '../lib/supabase'

async function generateQrCodes(mode: 'use-guid' | 'sequential' = 'use-guid') {
  console.log('🔄 Gerando QR codes para convidados...\n')
  console.log(`Modo: ${mode === 'use-guid' ? 'Usando GUID' : 'Sequencial'}\n`)

  try {
    // Buscar convidados sem QR code
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, name, email, guid, qr_code, event_id')
      .is('qr_code', null)
      .order('id')

    if (error) {
      console.error('❌ Erro ao buscar convidados:', error)
      return
    }

    if (!guests || guests.length === 0) {
      console.log('✅ Todos os convidados já têm QR code!')
      return
    }

    console.log(`📊 Convidados sem QR code: ${guests.length}\n`)

    let startNumber = 90001
    if (mode === 'sequential') {
      // Buscar o maior número existente
      const { data: maxGuest } = await supabase
        .from('guests')
        .select('qr_code')
        .not('qr_code', 'is', null)
        .order('qr_code', { ascending: false })
        .limit(1)

      if (maxGuest && maxGuest[0]) {
        const maxQrCode = maxGuest[0].qr_code
        const maxNumber = parseInt(maxQrCode)
        if (!isNaN(maxNumber)) {
          startNumber = maxNumber + 1
        }
      }
    }

    console.log('Atualizando convidados:\n')

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i]
      const qrCode = mode === 'use-guid'
        ? guest.guid
        : String(startNumber + i).padStart(5, '0')

      const eventName = guest.event_id === 1 ? 'Rio' : 'São Paulo'

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('guests')
        .update({ qr_code: qrCode })
        .eq('id', guest.id)

      if (updateError) {
        console.log(`❌ Erro ao atualizar ${guest.name}: ${updateError.message}`)
      } else {
        console.log(`✅ ID ${guest.id} - ${guest.name} (${eventName}): ${qrCode}`)
      }
    }

    console.log('\n✅ QR codes gerados com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Verifique os QR codes gerados no banco de dados')
    console.log('2. Gere os PDFs dos convites com esses QR codes')
    console.log('3. Salve os PDFs em public/events/rio/ ou public/events/saopaulo/')
    console.log('4. Execute: npx tsx scripts/check-pdf-files.ts para verificar')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2)
const mode = args.includes('--sequential') ? 'sequential' : 'use-guid'

// Executar o script
generateQrCodes(mode)
