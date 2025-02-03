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
      listing_drafts: {
        Row: {
          content: Json
          id: string
          last_saved_at: string
          user_id: string
        }
        Insert: {
          content: Json
          id?: string
          last_saved_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          id?: string
          last_saved_at?: string
          user_id?: string
        }
      }
      listing_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          is_featured: boolean
          listing_id: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_featured?: boolean
          listing_id: string
          position: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_featured?: boolean
          listing_id?: string
          position?: number
          url?: string
        }
      }
      listing_views: {
        Row: {
          id: string
          listing_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
      }
      listings: {
        Row: {
          auction_end_time: string | null
          auction_min_price: number | null
          auction_start_price: number | null
          allow_trade: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          location: Json
          price: number | null
          published_at: string | null
          shipping_available: boolean
          status: Database['public']['Enums']['listing_status']
          title: string
          type: Database['public']['Enums']['listing_type']
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          auction_end_time?: string | null
          auction_min_price?: number | null
          auction_start_price?: number | null
          allow_trade?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          location: Json
          price?: number | null
          published_at?: string | null
          shipping_available?: boolean
          status?: Database['public']['Enums']['listing_status']
          title: string
          type: Database['public']['Enums']['listing_type']
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          auction_end_time?: string | null
          auction_min_price?: number | null
          auction_start_price?: number | null
          allow_trade?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: Json
          price?: number | null
          published_at?: string | null
          shipping_available?: boolean
          status?: Database['public']['Enums']['listing_status']
          title?: string
          type?: Database['public']['Enums']['listing_type']
          updated_at?: string
          user_id?: string
          view_count?: number
        }
      }
    }
    Enums: {
      listing_status: 'draft' | 'active' | 'ended' | 'sold' | 'inactive'
      listing_type: 'fixed_price' | 'auction'
    }
  }
}