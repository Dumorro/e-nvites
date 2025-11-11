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
    const socialEventFilter = searchParams.get('social_event')
    const searchQuery = searchParams.get('search')

    let query = supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (statusFilter && ['pending', 'confirmed', 'declined'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    // Apply social_event filter if provided
    if (socialEventFilter) {
      query = query.eq('social_event', socialEventFilter)
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

    // Extract unique social events
    const socialEvents = [...new Set(data.map(g => g.social_event).filter(Boolean))] as string[]

    return NextResponse.json({
      guests: data,
      stats,
      socialEvents
    })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
