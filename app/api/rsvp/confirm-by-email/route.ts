import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createEmailSender, getInviteImageUrl, getEventEnglishTranslation } from '@/lib/email/email-sender'

// POST /api/rsvp/confirm-by-email - Confirm presence by email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, eventId } = body

    if (!email || !eventId) {
      return NextResponse.json(
        { error: 'Email e evento são obrigatórios' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // First, get the event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, location')
      .eq('id', eventId)
      .eq('is_active', true)
      .single()

    if (eventError || !event) {
      console.error('Event not found:', eventError)
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Check if guest exists with this email for this specific event
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('event_id', eventId)
      .single()

    if (guestError || !guest) {
      console.error('Guest not found:', guestError)
      return NextResponse.json(
        {
          error: 'Email não encontrado na lista de convidados. Somente pessoas pré-convidadas podem confirmar presença.'
        },
        { status: 404 }
      )
    }

    // Update guest status to confirmed
    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', guest.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating guest:', updateError)
      return NextResponse.json(
        { error: 'Erro ao confirmar presença' },
        { status: 500 }
      )
    }

    // Send confirmation email
    // NOTE: Email sending is transparent to the user - confirmation always succeeds
    // Using Promise.allSettled to ensure email Promise completes before function exits
    console.log(`📧 [RSVP] Starting post-confirmation email process`)
    console.log(`   → Guest ID: ${updatedGuest.id}`)
    console.log(`   → Email: ${updatedGuest.email}`)

    // Extract time from event date
    const extractTime = (dateString: string | null | undefined): string => {
      if (!dateString) return '18:30'

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '18:30'

        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        })
      } catch {
        return '18:30'
      }
    }

    // Get full event data for email
    const { data: fullEvent } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (updatedGuest.email && fullEvent) {
      // Create email Promise to ensure it completes
      const emailPromise = (async () => {
        try {
          const emailSender = createEmailSender()

          // Determine confirmation page based on event ID
          // Event ID 1 = Rio de Janeiro, Event ID 2 = São Paulo, Event ID 7 = Festa de Fim de Ano
          let confirmPage: string
          if (fullEvent.id === 2) {
            confirmPage = 'confirm-sp'
          } else if (fullEvent.id === 7) {
            confirmPage = 'confirm-festa'
          } else {
            confirmPage = 'confirm-rj'
          }

          console.log(`📤 [RSVP] Sending email (will wait for completion)`)
          console.log(`   → Event: ${fullEvent.name}`)
          console.log(`   → Confirmation page: ${confirmPage}`)

          // Generate invite image URL
          const qrCodeForUrl = updatedGuest.qr_code || updatedGuest.guid
          const inviteImageUrl = getInviteImageUrl(fullEvent.id, qrCodeForUrl, process.env.NEXT_PUBLIC_SITE_URL)

          // Get English translations
          const { nameEn, locationEn } = getEventEnglishTranslation(fullEvent.id, fullEvent.name, fullEvent.location || '')

          console.log(`   → Invite Image URL: ${inviteImageUrl}`)
          console.log(`   → Will attach invite image: Yes`)
          console.log(`   → Event Name (EN): ${nameEn}`)

          // Send email with retry
          return await emailSender.sendConfirmationEmailWithRetry(
            {
              to: updatedGuest.email,
              name: updatedGuest.name,
              qrCode: qrCodeForUrl,
              event: {
                name: fullEvent.name,
                nameEn: nameEn,
                date: fullEvent.event_date || '',
                time: extractTime(fullEvent.event_date),
                location: fullEvent.location || '',
                locationEn: locationEn,
              },
              confirmationGuid: updatedGuest.guid,
              confirmationLink: `${process.env.NEXT_PUBLIC_SITE_URL}/${confirmPage}?guid=${updatedGuest.guid}`,
              inviteImageUrl: inviteImageUrl,
              inviteImagePath: qrCodeForUrl,
              eventId: fullEvent.id,
            },
            updatedGuest.id
          )
        } catch (error) {
          console.error(`❌ [RSVP] Exception in email sending:`, error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })()

      // Wait for email Promise to settle (success or failure)
      // This ensures the email is sent before the serverless function terminates
      await Promise.allSettled([emailPromise]).then(([emailResult]) => {
        if (emailResult.status === 'fulfilled' && emailResult.value.success) {
          console.log(`✅ [RSVP] Confirmation email sent successfully`)
          console.log(`   → Recipient: ${updatedGuest.email}`)
          console.log(`   → Message ID: ${emailResult.value.messageId}`)
        } else {
          const error = emailResult.status === 'rejected'
            ? emailResult.reason
            : emailResult.value.error
          console.error(`❌ [RSVP] Failed to send confirmation email`)
          console.error(`   → Recipient: ${updatedGuest.email}`)
          console.error(`   → Error: ${error}`)
        }
      })
    } else {
      console.log(`⚠️  [RSVP] Skipping email send - missing email or event`)
      console.log(`   → Has email: ${!!updatedGuest.email}`)
      console.log(`   → Has event: ${!!fullEvent}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Presença confirmada com sucesso!',
      guestGuid: updatedGuest.guid
    })
  } catch (error) {
    console.error('Error confirming RSVP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
