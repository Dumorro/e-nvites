import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export async function GET(request: NextRequest) {
  try {
    // Verify admin password
    const password = request.headers.get('x-admin-password')
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    console.log(`📋 [Import Logs] Fetching logs${eventId ? ` for event ${eventId}` : ''}`)

    // Build query
    let query = supabase
      .from('import_logs')
      .select('*, events(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventId) {
      query = query.eq('event_id', parseInt(eventId, 10))
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('❌ [Import Logs] Error fetching logs:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar logs', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ [Import Logs] Found ${logs?.length || 0} logs`)

    return NextResponse.json({
      success: true,
      logs: logs || []
    })
  } catch (error) {
    console.error('❌ [Import Logs] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar requisição',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
