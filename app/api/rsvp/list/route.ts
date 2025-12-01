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
    const exportMode = searchParams.get('export') === 'true' // For CSV export (no limit)

    // Calculate statistics FIRST - using count queries (no data fetch, just counts)
    // Statistics based ONLY on event filter (ignore status and search filters)
    console.log('📊 [Stats Query] Starting stats calculation...')
    console.log('📊 [Stats Query] Event Filter:', eventIdFilter)

    // Build and execute count query for stats (only with event filter)
    const executeStatsQuery = async (status?: string) => {
      let query = supabase
        .from('guests')
        .select('id', { count: 'exact', head: true })

      // Apply event filter if needed
      if (eventIdFilter && eventIdFilter !== 'all') {
        query = query.eq('event_id', parseInt(eventIdFilter))
        console.log(`  🔍 Executing count query for event_id=${eventIdFilter}, status=${status || 'all'}`)
      } else {
        console.log(`  🔍 Executing count query for ALL events, status=${status || 'all'}`)
      }

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status)
      }

      const result = await query
      console.log(`  ✅ Result: count=${result.count}, error=${result.error?.message || 'none'}, data length=${result.data?.length || 0}`)
      return result
    }

    // Execute all count queries in parallel
    const [
      { count: totalCount, error: totalError },
      { count: confirmedCount, error: confirmedError },
      { count: declinedCount, error: declinedError },
      { count: pendingCount, error: pendingError }
    ] = await Promise.all([
      executeStatsQuery(),
      executeStatsQuery('confirmed'),
      executeStatsQuery('declined'),
      executeStatsQuery('pending')
    ])

    console.log('📊 [Stats Query Results]:')
    console.log('  - Total:', totalCount, '(error:', totalError?.message || 'none', ')')
    console.log('  - Confirmed:', confirmedCount, '(error:', confirmedError?.message || 'none', ')')
    console.log('  - Declined:', declinedCount, '(error:', declinedError?.message || 'none', ')')
    console.log('  - Pending:', pendingCount, '(error:', pendingError?.message || 'none', ')')

    if (totalError || confirmedError || declinedError || pendingError) {
      console.error('❌ [Stats Query] Full Errors:', {
        totalError: totalError ? JSON.stringify(totalError) : null,
        confirmedError: confirmedError ? JSON.stringify(confirmedError) : null,
        declinedError: declinedError ? JSON.stringify(declinedError) : null,
        pendingError: pendingError ? JSON.stringify(pendingError) : null
      })
    }

    // Now fetch actual data with join
    let query = supabase
      .from('guests')
      .select('id, guid, name, email, phone, event_id, status, created_at, updated_at, qr_code, event:events(id, name, location, event_date)')
      .order('created_at', { ascending: false })

    // Apply limit only if NOT in export mode
    if (!exportMode) {
      query = query.limit(1000) // Safety limit to prevent massive queries in regular mode
      console.log('📋 [Query Mode] Regular mode - applying 1000 limit')
    } else {
      console.log('📋 [Query Mode] Export mode - no limit applied')
    }

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

    // Get count of records matching ALL filters (for pagination display)
    let filteredCountQuery = supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })

    // Apply same filters as main query
    if (statusFilter && ['pending', 'confirmed', 'declined'].includes(statusFilter)) {
      filteredCountQuery = filteredCountQuery.eq('status', statusFilter)
    }

    if (eventIdFilter && eventIdFilter !== 'all') {
      filteredCountQuery = filteredCountQuery.eq('event_id', parseInt(eventIdFilter))
    }

    if (searchQuery) {
      filteredCountQuery = filteredCountQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { count: filteredCount } = await filteredCountQuery

    console.log('📊 [Filtered Count] Total matching all filters:', filteredCount)

    // Build stats object from count queries
    const stats = {
      total: totalCount || 0,
      confirmed: confirmedCount || 0,
      declined: declinedCount || 0,
      pending: pendingCount || 0,
    }

    console.log('📊 [Stats] Final stats:', stats)

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
      events,
      totalCount: filteredCount || 0  // Total count matching all applied filters
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
