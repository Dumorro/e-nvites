import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createEmailSender, getInviteImageUrl, getEventEnglishTranslation } from '@/lib/email/email-sender'

/**
 * POST /api/email/send-confirmation
 * Endpoint to manually send or resend confirmation emails
 *
 * Body params:
 * - guestId: number (optional if guid is provided)
 * - guid: string (optional if guestId is provided)
 *
 * Requires admin authentication via x-admin-password header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminPassword = request.headers.get('x-admin-password')
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { guestId, guid } = body

    if (!guestId && !guid) {
      return NextResponse.json(
        { error: 'Either guestId or guid must be provided' },
        { status: 400 }
      )
    }

    // Build query based on provided parameter
    let query = supabase
      .from('guests')
      .select('*, event:events(*)')

    if (guestId) {
      query = query.eq('id', guestId)
    } else {
      query = query.eq('guid', guid)
    }

    // Fetch guest and event data
    const { data: guest, error: guestError } = await query.single()

    if (guestError || !guest) {
      console.error('Guest not found:', guestError)
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Validate guest has email
    if (!guest.email) {
      return NextResponse.json(
        { error: 'Guest does not have an email address' },
        { status: 400 }
      )
    }

    // Validate guest is confirmed
    if (guest.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Guest is not confirmed. Only confirmed guests can receive confirmation emails.' },
        { status: 400 }
      )
    }

    // Validate event exists
    if (!guest.event) {
      return NextResponse.json(
        { error: 'Event not found for this guest' },
        { status: 404 }
      )
    }

    const event = guest.event as any

    // Validate event is active
    if (!event.is_active) {
      return NextResponse.json(
        { error: 'Event is not active' },
        { status: 400 }
      )
    }

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

    // Create email sender
    const emailSender = createEmailSender()

    // Determine confirmation page based on event ID
    // Event ID 1 = Rio de Janeiro, Event ID 2 = São Paulo
    const confirmPage = event.id === 2 ? 'confirm-sp' : 'confirm-rj'

    console.log(`📬 [API] Initiating email send/resend via API endpoint`)
    console.log(`   → Guest ID: ${guest.id}`)
    console.log(`   → Guest Name: ${guest.name}`)
    console.log(`   → Email: ${guest.email}`)
    console.log(`   → Event: ${event.name}`)
    console.log(`   → Status: ${guest.status}`)

    // Generate invite image URL
    const qrCodeForUrl = guest.qr_code || guest.guid
    const inviteImageUrl = getInviteImageUrl(event.id, qrCodeForUrl, process.env.NEXT_PUBLIC_SITE_URL)

    // Get English translations
    const { nameEn, locationEn } = getEventEnglishTranslation(event.id, event.name, event.location || '')

    console.log(`   → Invite Image URL: ${inviteImageUrl}`)
    console.log(`   → Will attach invite image: Yes`)
    console.log(`   → Event Name (EN): ${nameEn}`)

    // Send confirmation email
    const result = await emailSender.sendConfirmationEmailWithRetry(
      {
        to: guest.email,
        name: guest.name,
        qrCode: qrCodeForUrl,
        event: {
          name: event.name,
          nameEn: nameEn,
          date: event.event_date || '',
          time: extractTime(event.event_date),
          location: event.location || '',
          locationEn: locationEn,
        },
        confirmationGuid: guest.guid,
        confirmationLink: `${process.env.NEXT_PUBLIC_SITE_URL}/${confirmPage}?guid=${guest.guid}`,
        inviteImageUrl: inviteImageUrl,
        inviteImagePath: qrCodeForUrl,
        eventId: event.id,
      },
      guest.id
    )

    if (!result.success) {
      console.error(`❌ [API] Email send failed`)
      console.error(`   → Recipient: ${guest.email}`)
      console.error(`   → Error: ${result.error}`)
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: result.error
        },
        { status: 500 }
      )
    }

    console.log(`✅ [API] Email send request completed successfully`)
    console.log(`   → Message ID: ${result.messageId}`)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      recipient: guest.email,
    })
  } catch (error: any) {
    console.error('Error in send-confirmation endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message
      },
      { status: 500 }
    )
  }
}
