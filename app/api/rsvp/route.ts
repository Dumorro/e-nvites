import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/rsvp?guid=xxx - Get guest by GUID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const guid = searchParams.get('guid')

    if (!guid) {
      return NextResponse.json(
        { error: 'GUID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('guests')
      .select('*, event:events(*)')
      .eq('guid', guid)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Guest not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ guest: data })
  } catch (error) {
    console.error('Error fetching guest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/rsvp - Update RSVP status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guid, status } = body

    if (!guid || !status) {
      return NextResponse.json(
        { error: 'GUID and status are required' },
        { status: 400 }
      )
    }

    if (!['confirmed', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "confirmed" or "declined"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('guests')
      .update({ status })
      .eq('guid', guid)
      .select('*, event:events(*)')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Guest not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      guest: data,
      message: status === 'confirmed'
        ? 'Presença confirmada com sucesso!'
        : 'Presença recusada. Obrigado por avisar!'
    })
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
