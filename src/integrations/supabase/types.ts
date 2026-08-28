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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          operation_id: string
          source: string
          subscription_id: string | null
          tool_id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          operation_id: string
          source?: string
          subscription_id?: string | null
          tool_id: string
          transaction_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          operation_id?: string
          source?: string
          subscription_id?: string | null
          tool_id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          allowed_tools: string[]
          created_at: string
          id: string
          lemon_squeezy_variant_id: string | null
          monthly_limit: number | null
          name: string
          price: number
          slug: string
          sort_order: number
          unlimited: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_tools?: string[]
          created_at?: string
          id?: string
          lemon_squeezy_variant_id?: string | null
          monthly_limit?: number | null
          name: string
          price: number
          slug: string
          sort_order?: number
          unlimited?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_tools?: string[]
          created_at?: string
          id?: string
          lemon_squeezy_variant_id?: string | null
          monthly_limit?: number | null
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          unlimited?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          bonus_credits_remaining: number
          created_at: string
          email: string | null
          id: string
          name: string | null
          starter_bonus_granted: boolean
          starter_bonus_used: boolean
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          bonus_credits_remaining?: number
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          starter_bonus_granted?: boolean
          starter_bonus_used?: boolean
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          bonus_credits_remaining?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          starter_bonus_granted?: boolean
          starter_bonus_used?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          credits_used: number
          current_period_end: string | null
          current_period_start: string | null
          id: string
          lemon_squeezy_customer_id: string | null
          lemon_squeezy_subscription_id: string | null
          plan_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          credits_used?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          credits_used?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage: {
        Row: {
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          subscription_id: string | null
          tool_id: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          subscription_id?: string | null
          tool_id: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          subscription_id?: string | null
          tool_id?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credit: {
        Args: { _description?: string; _operation_id: string; _tool_id: string }
        Returns: Json
      }
      get_credit_state: { Args: never; Returns: Json }
      grant_starter_bonus: {
        Args: { _amount?: number; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
