/**
 * Test SMTP configuration
 *
 * Usage: npx tsx scripts/test-smtp.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createEmailSender, getInviteImageUrl } from '../lib/email/email-sender'

async function testSMTP() {
  console.log('🧪 Testing SMTP configuration...\n')

  try {
    console.log('📋 SMTP Settings:')
    console.log(`   → Host: ${process.env.SMTP_SERVER}`)
    console.log(`   → Port: ${process.env.SMTP_PORT}`)
    console.log(`   → Username: ${process.env.SMTP_USERNAME}`)
    console.log(`   → Sender: ${process.env.SMTP_SENDER}`)
    console.log(`   → From Name: ${process.env.SMTP_FROM_NAME}\n`)

    console.log('📧 Creating email sender...')
    const emailSender = createEmailSender()
    console.log('✅ Email sender created successfully\n')

    console.log('📤 Sending test email...')

    // Generate test invite URL (using event ID 2 for São Paulo)
    // Using a real QR code that exists in the system
    const testQrCode = '90001'
    const testEventId = 2
    const inviteImageUrl = getInviteImageUrl(testEventId, testQrCode, process.env.NEXT_PUBLIC_SITE_URL)

    console.log(`   → Generated invite URL: ${inviteImageUrl}`)
    console.log(`   → Will attach invite image from: public/events/oil-celebration-sp/${testQrCode}-oil-celebration-sp.jpg\n`)

    const result = await emailSender.sendConfirmationEmail({
      to: 'dumorro@gmail.com',
      name: 'Teste SMTP com Anexo',
      qrCode: testQrCode,
      event: {
        name: 'Celebração do 1º Óleo de Bacalhau - São Paulo',
        date: '2025-12-31',
        time: '19:00',
        location: 'Local de Teste',
      },
      confirmationGuid: 'test-guid-12345',
      confirmationLink: 'https://www.confirmacaoequinor.com.br/confirm-sp?guid=test-guid-12345',
      inviteImageUrl: inviteImageUrl,
      inviteImagePath: testQrCode,
      eventId: testEventId,
    })

    if (result.success) {
      console.log('\n✅ Test email sent successfully!')
      console.log(`   → Message ID: ${result.messageId}`)
    } else {
      console.error('\n❌ Failed to send test email')
      console.error(`   → Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error)
    process.exit(1)
  }
}

testSMTP()
