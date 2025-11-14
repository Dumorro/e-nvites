import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/rsvp/list - List all guests (admin endpoint)
export async function GET(request: NextRequest) {
  try {
    // Simple authentication check
    const password = request.headers.get('x-admin-password')

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status')
    const eventIdFilter = searchParams.get('event_id')
    const searchQuery = searchParams.get('search')

    let query = supabase
      .from('guests')
      .select('*, event:events(*)')
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (statusFilter && ['pending', 'confirmed', 'declined'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    // Apply event_id filter if provided
    if (eventIdFilter && eventIdFilter !== 'all') {
      query = query.eq('event_id', parseInt(eventIdFilter))
    }

    // Apply search filter if provided
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      confirmed: data.filter(g => g.status === 'confirmed').length,
      declined: data.filter(g => g.status === 'declined').length,
      pending: data.filter(g => g.status === 'pending').length,
    }

    // Fetch all active events from database
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id, name, slug, template_name, event_date, location')
      .eq('is_active', true)
      .order('event_date', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
    }

    const events = eventsData || []

    return NextResponse.json({
      guests: data,
      stats,
      events
    })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
