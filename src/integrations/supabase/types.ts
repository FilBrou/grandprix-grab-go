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
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          hero_image_url: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          start_date: string
          status: string
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          hero_image_url?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          start_date: string
          status?: string
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          hero_image_url?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          start_date?: string
          status?: string
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          stock?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      monday_config: {
        Row: {
          auto_sync: boolean
          board_id: string
          board_name: string
          created_at: string
          event_id: string | null
          id: string
          status_mapping: Json
          updated_at: string
        }
        Insert: {
          auto_sync?: boolean
          board_id: string
          board_name: string
          created_at?: string
          event_id?: string | null
          id?: string
          status_mapping?: Json
          updated_at?: string
        }
        Update: {
          auto_sync?: boolean
          board_id?: string
          board_name?: string
          created_at?: string
          event_id?: string | null
          id?: string
          status_mapping?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monday_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id?: string | null
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          order_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_location: string | null
          event_id: string
          id: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          user_location_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_location?: string | null
          event_id: string
          id?: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
          user_location_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_location?: string | null
          event_id?: string
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          user_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_location_id_fkey"
            columns: ["user_location_id"]
            isOneToOne: false
            referencedRelation: "user_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_return_items: {
        Row: {
          created_at: string
          declared_quantity: number
          id: string
          item_id: string
          reason: string | null
          return_id: string
          unit_price: number
          validated_quantity: number | null
        }
        Insert: {
          created_at?: string
          declared_quantity: number
          id?: string
          item_id: string
          reason?: string | null
          return_id: string
          unit_price: number
          validated_quantity?: number | null
        }
        Update: {
          created_at?: string
          declared_quantity?: number
          id?: string
          item_id?: string
          reason?: string | null
          return_id?: string
          unit_price?: number
          validated_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_return_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "product_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      product_returns: {
        Row: {
          admin_notes: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          return_date: string
          status: string
          updated_at: string
          user_id: string
          user_location_id: string | null
          validated_by: string | null
          validation_date: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          return_date?: string
          status?: string
          updated_at?: string
          user_id: string
          user_location_id?: string | null
          validated_by?: string | null
          validation_date?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          return_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_location_id?: string | null
          validated_by?: string | null
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_returns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_user_location_id_fkey"
            columns: ["user_location_id"]
            isOneToOne: false
            referencedRelation: "user_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          location: string | null
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          location?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          address: string | null
          created_at: string
          event_id: string
          id: string
          location_name: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          event_id: string
          id?: string
          location_name: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          event_id?: string
          id?: string
          location_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      calculate_user_returns_total: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: number
      }
      get_daily_sales:
        | {
            Args: { days?: number }
            Returns: {
              date: string
              order_count: number
              total_sales: number
            }[]
          }
        | {
            Args: { days?: number; event_uuid: string }
            Returns: {
              date: string
              order_count: number
              total_sales: number
            }[]
          }
      get_popular_items:
        | {
            Args: { event_uuid: string; limit_count?: number }
            Returns: {
              item_name: string
              total_quantity: number
              total_revenue: number
            }[]
          }
        | {
            Args: { limit_count?: number }
            Returns: {
              item_name: string
              total_quantity: number
              total_revenue: number
            }[]
          }
      get_sales_statistics:
        | {
            Args: never
            Returns: {
              average_order_value: number
              total_items_sold: number
              total_orders: number
              total_revenue: number
            }[]
          }
        | {
            Args: { event_uuid: string }
            Returns: {
              average_order_value: number
              total_items_sold: number
              total_orders: number
              total_revenue: number
            }[]
          }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      update_item_stock: {
        Args: { item_id: string; quantity_to_subtract: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
