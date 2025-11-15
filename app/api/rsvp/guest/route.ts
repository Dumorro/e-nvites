import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/rsvp/guest?guid=xxx - Get guest details by GUID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const guestGuid = searchParams.get('guid')

    console.log('[Guest API] Received GUID:', guestGuid)

    if (!guestGuid) {
      return NextResponse.json(
        { error: 'GUID do convidado é obrigatório' },
        { status: 400 }
      )
    }

    // First, try to get just the guest
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('guid', guestGuid)
      .single()

    console.log('[Guest API] Guest query result:', { guest, guestError })

    if (guestError || !guest) {
      console.error('[Guest API] Guest not found:', guestError)
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      )
    }

    // Then get the event separately
    let eventData = null
    if (guest.event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, location, date, time')
        .eq('id', guest.event_id)
        .single()

      console.log('[Guest API] Event query result:', { event, eventError })

      if (!eventError && event) {
        eventData = event
      }
    }

    const guestWithEvent = {
      ...guest,
      event: eventData
    }

    console.log('[Guest API] Returning guest with event:', guestWithEvent)

    return NextResponse.json({
      success: true,
      guest: guestWithEvent
    })
  } catch (error) {
    console.error('[Guest API] Error fetching guest:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
