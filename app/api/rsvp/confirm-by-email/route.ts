import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createEmailSender, getInviteImageUrl } from '@/lib/email/email-sender'

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
    // NOTE: Email sending is non-blocking and failures won't affect the confirmation
    try {
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
        const emailSender = createEmailSender()

        // Determine confirmation page based on event ID
        // Event ID 1 = Rio de Janeiro, Event ID 2 = São Paulo
        const confirmPage = fullEvent.id === 2 ? 'confirm-sp' : 'confirm-rj'

        console.log(`📤 [RSVP] Sending email asynchronously (non-blocking)`)
        console.log(`   → Event: ${fullEvent.name}`)
        console.log(`   → Confirmation page: ${confirmPage}`)

        // Generate invite image URL
        const qrCodeForUrl = updatedGuest.qr_code || updatedGuest.guid
        const inviteImageUrl = getInviteImageUrl(fullEvent.id, qrCodeForUrl, process.env.NEXT_PUBLIC_SITE_URL)

        console.log(`   → Invite Image URL: ${inviteImageUrl}`)
        console.log(`   → Will attach invite image: Yes`)

        // Send email asynchronously (don't await to not block response)
        emailSender.sendConfirmationEmailWithRetry(
          {
            to: updatedGuest.email,
            name: updatedGuest.name,
            qrCode: qrCodeForUrl,
            event: {
              name: fullEvent.name,
              date: fullEvent.event_date || '',
              time: extractTime(fullEvent.event_date),
              location: fullEvent.location || '',
            },
            confirmationGuid: updatedGuest.guid,
            confirmationLink: `${process.env.NEXT_PUBLIC_SITE_URL}/${confirmPage}?guid=${updatedGuest.guid}`,
            inviteImageUrl: inviteImageUrl,
            inviteImagePath: qrCodeForUrl,
            eventId: fullEvent.id,
          },
          updatedGuest.id
        ).then((result) => {
          if (result.success) {
            console.log(`✅ [RSVP] Confirmation email sent successfully`)
            console.log(`   → Recipient: ${updatedGuest.email}`)
            console.log(`   → Message ID: ${result.messageId}`)
          } else {
            console.error(`❌ [RSVP] Failed to send confirmation email`)
            console.error(`   → Recipient: ${updatedGuest.email}`)
            console.error(`   → Error: ${result.error}`)
          }
        }).catch((error) => {
          console.error(`❌ [RSVP] Exception in email sending:`, error)
        })
      } else {
        console.log(`⚠️  [RSVP] Skipping email send - missing email or event`)
        console.log(`   → Has email: ${!!updatedGuest.email}`)
        console.log(`   → Has event: ${!!fullEvent}`)
      }
    } catch (emailError) {
      // Log error but don't fail the confirmation
      console.error('❌ [RSVP] Error in email sending process:', emailError)
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
