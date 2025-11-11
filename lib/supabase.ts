import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Guest {
  id: number
  guid: string
  name: string
  email: string | null
  phone: string | null
  social_event: string | null
  status: 'pending' | 'confirmed' | 'declined'
  created_at: string
  updated_at: string
}
