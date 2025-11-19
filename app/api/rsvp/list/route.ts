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

    // First, get count of total records matching filters (without join)
    let countQuery = supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })

    // Apply same filters to count query
    if (statusFilter && ['pending', 'confirmed', 'declined'].includes(statusFilter)) {
      countQuery = countQuery.eq('status', statusFilter)
    }

    if (eventIdFilter && eventIdFilter !== 'all') {
      countQuery = countQuery.eq('event_id', parseInt(eventIdFilter))
    }

    if (searchQuery) {
      countQuery = countQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    // Now fetch actual data with join
    let query = supabase
      .from('guests')
      .select('id, guid, name, email, phone, event_id, status, created_at, updated_at, qr_code, event:events(id, name, location, event_date)')
      .order('created_at', { ascending: false })
      .limit(1000) // Safety limit to prevent massive queries

    // Apply status filter if provided
    if (statusFilter && ['pending', 'confirmed', 'declined'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    // Apply event_id filter if provided
    if (eventIdFilter && eventIdFilter !== 'all') {
      query = query.eq('event_id', parseInt(eventIdFilter))
    }

    // Apply search filter if provided (search by name OR email)
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        {
          error: 'Erro ao buscar convidados',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
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
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
