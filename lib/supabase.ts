import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Event {
  id: number
  name: string
  slug: string
  description: string | null
  event_date: string | null
  location: string | null
  template_name: string
  primary_color: string
  secondary_color: string
  background_style: string
  logo_url: string | null
  banner_image_url: string | null
  welcome_message: string
  event_details: string | null
  show_qr_code: boolean
  show_event_details: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Guest {
  id: number
  guid: string
  name: string
  email: string | null
  phone: string | null
  event_id: number | null
  status: 'pending' | 'confirmed' | 'declined'
  qr_code: string | null
  created_at: string
  updated_at: string
}

export interface GuestWithEvent extends Guest {
  event?: Event | null
}

export interface EmailLog {
  id: number
  guest_id: number | null
  recipient_email: string
  recipient_name: string | null
  subject: string | null
  status: 'sent' | 'failed' | 'pending'
  error_message: string | null
  sent_at: string
  created_at: string
}
