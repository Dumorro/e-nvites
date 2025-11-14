import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/rsvp/confirm-by-email - Confirm presence by email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, eventSlug } = body

    if (!email || !eventSlug) {
      return NextResponse.json(
        { error: 'Email e evento são obrigatórios' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // First, get the event ID from the slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, location')
      .eq('slug', eventSlug)
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
      .eq('event_id', event.id)
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

    return NextResponse.json({
      success: true,
      message: 'Presença confirmada com sucesso!',
      guest: {
        ...updatedGuest,
        event: {
          name: event.name,
          location: event.location
        }
      }
    })
  } catch (error) {
    console.error('Error confirming RSVP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
