export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      article_assets: {
        Row: {
          article_id: string
          asset_id: string
        }
        Insert: {
          article_id: string
          asset_id: string
        }
        Update: {
          article_id?: string
          asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_assets_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      article_companies: {
        Row: {
          article_id: string
          company_id: string
        }
        Insert: {
          article_id: string
          company_id: string
        }
        Update: {
          article_id?: string
          company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_companies_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      article_topics: {
        Row: {
          article_id: string
          topic_id: string
        }
        Insert: {
          article_id: string
          topic_id: string
        }
        Update: {
          article_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_topics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          hero_image_url: string | null
          id: string
          publish_date: string | null
          region_id: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          hero_image_url?: string | null
          id?: string
          publish_date?: string | null
          region_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          hero_image_url?: string | null
          id?: string
          publish_date?: string | null
          region_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          country: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          operator_company_id: string | null
          region_id: string | null
          slug: string
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          operator_company_id?: string | null
          region_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          operator_company_id?: string | null
          region_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_operator_company_id_fkey"
            columns: ["operator_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          slug: string
          specializations: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          specializations?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          specializations?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          headquarters: string | null
          id: string
          industry_role: Database["public"]["Enums"]["company_role"] | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          region_id: string | null
          slug: string
          updated_at: string
          website: string | null
          year_founded: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          headquarters?: string | null
          id?: string
          industry_role?: Database["public"]["Enums"]["company_role"] | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          region_id?: string | null
          slug: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          headquarters?: string | null
          id?: string
          industry_role?: Database["public"]["Enums"]["company_role"] | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          region_id?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
          year_founded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          contact_reason: Database["public"]["Enums"]["contact_reason"]
          email: string
          id: string
          job_title: string | null
          message: string
          name: string
          notes: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          company?: string | null
          contact_reason: Database["public"]["Enums"]["contact_reason"]
          email: string
          id?: string
          job_title?: string | null
          message: string
          name: string
          notes?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          company?: string | null
          contact_reason?: Database["public"]["Enums"]["contact_reason"]
          email?: string
          id?: string
          job_title?: string | null
          message?: string
          name?: string
          notes?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: []
      }
      draft_articles: {
        Row: {
          body_markdown: string | null
          created_at: string
          editor_notes: string | null
          excerpt: string | null
          hero_image_url: string | null
          id: string
          region_id: string | null
          slug: string
          source_article_id: string | null
          status: Database["public"]["Enums"]["draft_article_status"]
          suggested_company_ids: string[] | null
          suggested_topic_ids: string[] | null
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string | null
          created_at?: string
          editor_notes?: string | null
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          region_id?: string | null
          slug: string
          source_article_id?: string | null
          status?: Database["public"]["Enums"]["draft_article_status"]
          suggested_company_ids?: string[] | null
          suggested_topic_ids?: string[] | null
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string | null
          created_at?: string
          editor_notes?: string | null
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          region_id?: string | null
          slug?: string
          source_article_id?: string | null
          status?: Database["public"]["Enums"]["draft_article_status"]
          suggested_company_ids?: string[] | null
          suggested_topic_ids?: string[] | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_articles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_articles_source_article_id_fkey"
            columns: ["source_article_id"]
            isOneToOne: false
            referencedRelation: "source_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_suggestions: {
        Row: {
          business_score: number | null
          created_at: string
          description: string | null
          id: string
          seo_score: number | null
          source: string | null
          status: string
          suggestion_type: string
          target_company_ids: string[] | null
          target_region_id: string | null
          target_topic_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          business_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          seo_score?: number | null
          source?: string | null
          status?: string
          suggestion_type?: string
          target_company_ids?: string[] | null
          target_region_id?: string | null
          target_topic_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          business_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          seo_score?: number | null
          source?: string | null
          status?: string
          suggestion_type?: string
          target_company_ids?: string[] | null
          target_region_id?: string | null
          target_topic_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_suggestions_target_region_id_fkey"
            columns: ["target_region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendees_count: string | null
          created_at: string
          description: string | null
          end_date: string | null
          exhibitors_count: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          location: string
          name: string
          region_id: string | null
          slug: string
          start_date: string
          updated_at: string
          venue: string | null
          video_url: string | null
          website: string | null
        }
        Insert: {
          attendees_count?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          exhibitors_count?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location: string
          name: string
          region_id?: string | null
          slug: string
          start_date: string
          updated_at?: string
          venue?: string | null
          video_url?: string | null
          website?: string | null
        }
        Update: {
          attendees_count?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          exhibitors_count?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string
          name?: string
          region_id?: string | null
          slug?: string
          start_date?: string
          updated_at?: string
          venue?: string | null
          video_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      executives: {
        Row: {
          bio: string | null
          company_id: string | null
          company_name: string
          created_at: string
          id: string
          linkedin_url: string | null
          name: string
          photo_url: string | null
          region: string
          slug: string
          stock_symbol: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          region: string
          slug: string
          stock_symbol?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          region?: string
          slug?: string
          stock_symbol?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      product_articles: {
        Row: {
          article_id: string
          product_id: string
        }
        Insert: {
          article_id: string
          product_id: string
        }
        Update: {
          article_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_articles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          hero_image_url: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      product_companies: {
        Row: {
          company_id: string
          product_id: string
        }
        Insert: {
          company_id: string
          product_id: string
        }
        Update: {
          company_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_companies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          api_standard: string | null
          applications: string[] | null
          category_id: string | null
          created_at: string
          description: string | null
          gallery_images: Json | null
          hero_image_url: string | null
          id: string
          name: string
          short_description: string | null
          slug: string
          sort_order: number | null
          technical_specs: Json | null
          updated_at: string
        }
        Insert: {
          api_standard?: string | null
          applications?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          gallery_images?: Json | null
          hero_image_url?: string | null
          id?: string
          name: string
          short_description?: string | null
          slug: string
          sort_order?: number | null
          technical_specs?: Json | null
          updated_at?: string
        }
        Update: {
          api_standard?: string | null
          applications?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          gallery_images?: Json | null
          hero_image_url?: string | null
          id?: string
          name?: string
          short_description?: string | null
          slug?: string
          sort_order?: number | null
          technical_specs?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      scrape_sources: {
        Row: {
          articles_found: number | null
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          name: string
          priority: number | null
          region: string
          scrape_config: Json | null
          source_type: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          articles_found?: number | null
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name: string
          priority?: number | null
          region?: string
          scrape_config?: Json | null
          source_type?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          articles_found?: number | null
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string
          priority?: number | null
          region?: string
          scrape_config?: Json | null
          source_type?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      source_articles: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          language: string
          meta: Json | null
          raw_content: string | null
          region_id: string | null
          scraped_at: string
          source_name: string
          source_url: string
          status: Database["public"]["Enums"]["source_article_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          language?: string
          meta?: Json | null
          raw_content?: string | null
          region_id?: string | null
          scraped_at?: string
          source_name: string
          source_url: string
          status?: Database["public"]["Enums"]["source_article_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          language?: string
          meta?: Json | null
          raw_content?: string | null
          region_id?: string | null
          scraped_at?: string
          source_name?: string
          source_url?: string
          status?: Database["public"]["Enums"]["source_article_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_articles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      steel_prices: {
        Row: {
          category: string
          change: number | null
          change_percent: number | null
          created_at: string
          currency: string | null
          id: string
          name: string
          price: number
          region: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          category?: string
          change?: number | null
          change_percent?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          name: string
          price: number
          region?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          category?: string
          change?: number | null
          change_percent?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          name?: string
          price?: number
          region?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      top_companies_watchlist: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          priority: number | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "top_companies_watchlist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      article_status: "draft" | "published" | "featured"
      asset_status: "active" | "construction" | "idle" | "decommissioned"
      asset_type: "mill" | "yard" | "rig" | "port" | "coating" | "inspection"
      company_role:
        | "mill"
        | "yard"
        | "inspection"
        | "drilling"
        | "logistics"
        | "software"
        | "trading"
      contact_reason:
        | "advertisement"
        | "media_partnership"
        | "article_promotion"
        | "questions"
        | "event_coverage"
        | "expert_contribution"
        | "data_access"
        | "consulting"
      draft_article_status: "pending_review" | "approved" | "rejected"
      source_article_status: "new" | "processed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor"],
      article_status: ["draft", "published", "featured"],
      asset_status: ["active", "construction", "idle", "decommissioned"],
      asset_type: ["mill", "yard", "rig", "port", "coating", "inspection"],
      company_role: [
        "mill",
        "yard",
        "inspection",
        "drilling",
        "logistics",
        "software",
        "trading",
      ],
      contact_reason: [
        "advertisement",
        "media_partnership",
        "article_promotion",
        "questions",
        "event_coverage",
        "expert_contribution",
        "data_access",
        "consulting",
      ],
      draft_article_status: ["pending_review", "approved", "rejected"],
      source_article_status: ["new", "processed", "failed"],
    },
  },
} as const
