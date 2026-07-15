export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'provider'
          avatar_url: string | null
          lga_id: number | null
          lga_name: string | null
          lat: number | null
          lng: number | null
          is_complete: boolean
          is_verified: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'provider'
          avatar_url?: string | null
          lga_id?: number | null
          lga_name?: string | null
          lat?: number | null
          lng?: number | null
          is_complete?: boolean
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'provider'
          avatar_url?: string | null
          lga_id?: number | null
          lga_name?: string | null
          lat?: number | null
          lng?: number | null
          is_complete?: boolean
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      providers: {
        Row: {
          id: string
          business_name: string | null
          description: string | null
          selected_tier_slug: string
          selected_category_slug: string
          selected_subcategory_id: number | null
          tags: string[] | null
          is_available: boolean
          status: 'available' | 'busy' | 'away'
          boost_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_name?: string | null
          description?: string | null
          selected_tier_slug: string
          selected_category_slug: string
          selected_subcategory_id?: number | null
          tags?: string[] | null
          is_available?: boolean
          status?: 'available' | 'busy' | 'away'
          boost_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string | null
          description?: string | null
          selected_tier_slug?: string
          selected_category_slug?: string
          selected_subcategory_id?: number | null
          tags?: string[] | null
          is_available?: boolean
          status?: 'available' | 'busy' | 'away'
          boost_until?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_number: string
          customer_id: string
          provider_id: string
          service_name: string
          booking_date: string
          booking_time: string
          duration_minutes: number
          price: number | null
          location: string | null
          special_instructions: string | null
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_provider' | 'no_show'
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_number?: string
          customer_id: string
          provider_id: string
          service_name: string
          booking_date: string
          booking_time: string
          duration_minutes?: number
          price?: number | null
          location?: string | null
          special_instructions?: string | null
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_provider' | 'no_show'
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_number?: string
          customer_id?: string
          provider_id?: string
          service_name?: string
          booking_date?: string
          booking_time?: string
          duration_minutes?: number
          price?: number | null
          location?: string | null
          special_instructions?: string | null
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_provider' | 'no_show'
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          provider_id: string
          rating: number
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          provider_id: string
          rating: number
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          provider_id?: string
          rating?: number
          content?: string | null
          created_at?: string
        }
      }
      threads: {
        Row: {
          id: string
          provider_id: string
          customer_id: string
          booking_id: string | null
          last_message: string | null
          last_message_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          customer_id: string
          booking_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          customer_id?: string
          booking_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read: boolean
          read_at: string | null
          created_at: string
          attachment_url: string | null
          attachment_type: string | null
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          attachment_url?: string | null
          attachment_type?: string | null
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          attachment_url?: string | null
          attachment_type?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          data: Json
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          data?: Json
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          data?: Json
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      portfolio_images: {
        Row: {
          id: string
          provider_id: string
          image_url: string
          title: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          image_url: string
          title?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          image_url?: string
          title?: string | null
          description?: string | null
          created_at?: string
        }
      }
      lga_centers: {
        Row: {
          lga_id: number
          lga_name: string
          state_id: number
          state_name: string
          lat: number | null
          lng: number | null
          created_at: string
        }
        Insert: {
          lga_id: number
          lga_name: string
          state_id: number
          state_name: string
          lat?: number | null
          lng?: number | null
          created_at?: string
        }
        Update: {
          lga_id?: number
          lga_name?: string
          state_id?: number
          state_name?: string
          lat?: number | null
          lng?: number | null
          created_at?: string
        }
      }
      subcategories: {
        Row: {
          id: number
          name: string
          category_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          category_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          category_id?: number | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Provider = Tables<'providers'>
export type Booking = Tables<'bookings'>
export type Review = Tables<'reviews'>
export type Thread = Tables<'threads'>
export type Message = Tables<'messages'>
export type Notification = Tables<'notifications'>
export type PortfolioImage = Tables<'portfolio_images'>
export type LGACenter = Tables<'lga_centers'>
export type Subcategory = Tables<'subcategories'>
export type Category = Tables<'categories'>

export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']