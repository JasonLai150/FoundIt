import { createClient } from '@supabase/supabase-js'

// TODO: Replace these with your actual Supabase project credentials
// Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
const supabaseUrl = 'https://bnbyegbysoeeehevevsx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnllZ2J5c29lZWVoZXZldnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzOTQ1MzUsImV4cCI6MjA2NTk3MDUzNX0.-47qcgd_mpNOMb1JY1x8Wdz2wYfIQE5jeyxENhJRakw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Database types (will be auto-generated later)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          dob?: string
          location?: string
          goal?: 'recruiting' | 'searching' | 'investing' | 'other'
          role?: string
          bio?: string
          github?: string
          linkedin?: string
          website?: string
          avatar_url?: string
          profile_complete?: boolean
          created_at: string
          updated_at: string
          // Goal-specific JSONB fields
          company_name?: string
          company_description?: string
          firm_name?: string
          firm_description?: string
          desired_skills?: string[]
          funding?: {
            round?: string
            amount?: string
            investors?: string[]
          }
          investment_areas?: string[]
          investment_amount?: {
            min?: number
            max?: number
          }
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          dob?: string
          location?: string
          goal?: 'recruiting' | 'searching' | 'investing' | 'other'
          role?: string
          bio?: string
          github?: string
          linkedin?: string
          website?: string
          avatar_url?: string
          profile_complete?: boolean
          // Goal-specific JSONB fields
          company_name?: string
          company_description?: string
          firm_name?: string
          firm_description?: string
          desired_skills?: string[]
          funding?: {
            round?: string
            amount?: string
            investors?: string[]
          }
          investment_areas?: string[]
          investment_amount?: {
            min?: number
            max?: number
          }
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          dob?: string
          location?: string
          goal?: 'recruiting' | 'searching' | 'investing' | 'other'
          role?: string
          bio?: string
          github?: string
          linkedin?: string
          website?: string
          avatar_url?: string
          profile_complete?: boolean
          // Goal-specific JSONB fields
          company_name?: string
          company_description?: string
          firm_name?: string
          firm_description?: string
          desired_skills?: string[]
          funding?: {
            round?: string
            amount?: string
            investors?: string[]
          }
          investment_areas?: string[]
          investment_amount?: {
            min?: number
            max?: number
          }
        }
      }
      experience: {
        Row: {
          id: string
          profile_id: string
          education?: {
            school_name: string
            degree?: string
            major?: string
          }[]
          work_experience?: any
          skills?: string[]
          graduation_date?: string
          created_at: string
        }
        Insert: {
          profile_id: string
          education?: {
            school_name: string
            degree?: string
            major?: string
          }[]
          work_experience?: any
          skills?: string[]
          graduation_date?: string
        }
        Update: {
          id?: string
          profile_id?: string
          education?: {
            school_name: string
            degree?: string
            major?: string
          }[]
          work_experience?: any
          skills?: string[]
          graduation_date?: string
        }
      }
    }
  }
} 