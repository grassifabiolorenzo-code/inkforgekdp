export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          body: string | null;
          created_at: string;
          event: string;
          id: string;
          metadata: Json;
          read_by: string[];
          severity: string;
          title: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          event: string;
          id?: string;
          metadata?: Json;
          read_by?: string[];
          severity?: string;
          title: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          event?: string;
          id?: string;
          metadata?: Json;
          read_by?: string[];
          severity?: string;
          title?: string;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          last_login_at: string | null;
          role: string;
          suspended: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          last_login_at?: string | null;
          role: string;
          suspended?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          last_login_at?: string | null;
          role?: string;
          suspended?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          admin_email: string | null;
          admin_id: string | null;
          created_at: string;
          id: string;
          ip: string | null;
          metadata: Json;
          result: string;
          target_id: string | null;
          target_type: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          admin_email?: string | null;
          admin_id?: string | null;
          created_at?: string;
          id?: string;
          ip?: string | null;
          metadata?: Json;
          result?: string;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          admin_email?: string | null;
          admin_id?: string | null;
          created_at?: string;
          id?: string;
          ip?: string | null;
          metadata?: Json;
          result?: string;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          operation_id: string;
          source: string;
          subscription_id: string | null;
          tool_id: string;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          operation_id: string;
          source?: string;
          subscription_id?: string | null;
          tool_id: string;
          transaction_type?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          operation_id?: string;
          source?: string;
          subscription_id?: string | null;
          tool_id?: string;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_flags: {
        Row: {
          created_at: string;
          description: string | null;
          enabled: boolean;
          enabled_for_all: boolean;
          enabled_plans: string[];
          enabled_user_ids: string[];
          id: string;
          key: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          enabled_for_all?: boolean;
          enabled_plans?: string[];
          enabled_user_ids?: string[];
          id?: string;
          key: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          enabled_for_all?: boolean;
          enabled_plans?: string[];
          enabled_user_ids?: string[];
          id?: string;
          key?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number | null;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          plan_slug: string | null;
          provider: string;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          raw_event: string | null;
          status: string;
          subscription_id: string | null;
          user_id: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          plan_slug?: string | null;
          provider?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          raw_event?: string | null;
          status: string;
          subscription_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          plan_slug?: string | null;
          provider?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          raw_event?: string | null;
          status?: string;
          subscription_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          active: boolean;
          allowed_tools: string[];
          created_at: string;
          id: string;
          lemon_squeezy_variant_id: string | null;
          monthly_limit: number | null;
          name: string;
          price: number;
          slug: string;
          sort_order: number;
          unlimited: boolean;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          allowed_tools?: string[];
          created_at?: string;
          id?: string;
          lemon_squeezy_variant_id?: string | null;
          monthly_limit?: number | null;
          name: string;
          price: number;
          slug: string;
          sort_order?: number;
          unlimited?: boolean;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          allowed_tools?: string[];
          created_at?: string;
          id?: string;
          lemon_squeezy_variant_id?: string | null;
          monthly_limit?: number | null;
          name?: string;
          price?: number;
          slug?: string;
          sort_order?: number;
          unlimited?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar: string | null;
          bonus_credits_remaining: number;
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          starter_bonus_granted: boolean;
          starter_bonus_used: boolean;
          updated_at: string;
        };
        Insert: {
          avatar?: string | null;
          bonus_credits_remaining?: number;
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          starter_bonus_granted?: boolean;
          starter_bonus_used?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar?: string | null;
          bonus_credits_remaining?: number;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          starter_bonus_granted?: boolean;
          starter_bonus_used?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancelled_at: string | null;
          created_at: string;
          credits_used: number;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          lemon_squeezy_customer_id: string | null;
          lemon_squeezy_subscription_id: string | null;
          plan_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancelled_at?: string | null;
          created_at?: string;
          credits_used?: number;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          plan_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancelled_at?: string | null;
          created_at?: string;
          credits_used?: number;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          plan_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      usage: {
        Row: {
          created_at: string;
          id: string;
          period_end: string | null;
          period_start: string | null;
          subscription_id: string | null;
          tool_id: string;
          updated_at: string;
          usage_count: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          subscription_id?: string | null;
          tool_id: string;
          updated_at?: string;
          usage_count?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          subscription_id?: string | null;
          tool_id?: string;
          updated_at?: string;
          usage_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_purchased_credits: {
        Args: { _amount: number; _description?: string; _operation_id: string; _user_id: string };
        Returns: Json;
      };
      admin_active_users_counts: { Args: never; Returns: Json };
      admin_analytics_summary: { Args: never; Returns: Json };
      admin_dashboard_kpis: { Args: never; Returns: Json };
      admin_db_ping: { Args: never; Returns: Json };
      admin_find_user_id_by_email: { Args: { _email: string }; Returns: string };
      admin_get_user_detail: { Args: { _user_id: string }; Returns: Json };
      admin_global_search: { Args: { _query: string }; Returns: Json };
      admin_list_payments: {
        Args: {
          _from?: string;
          _limit?: number;
          _offset?: number;
          _search?: string;
          _status?: string;
          _to?: string;
        };
        Returns: {
          amount: number | null;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          plan_slug: string | null;
          provider: string;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          status: string;
          total_count: number;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
        }[];
      };
      admin_list_subscriptions: {
        Args: {
          _limit?: number;
          _offset?: number;
          _plan_slug?: string;
          _search?: string;
          _status?: string;
        };
        Returns: {
          cancelled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_name: string | null;
          plan_price: number | null;
          plan_slug: string | null;
          status: string;
          total_count: number;
          user_email: string | null;
          user_id: string;
          user_name: string | null;
        }[];
      };
      admin_list_users: {
        Args: {
          _limit?: number;
          _offset?: number;
          _plan_slug?: string;
          _role?: string;
          _search?: string;
          _sort?: string;
          _sort_dir?: string;
          _status?: string;
        };
        Returns: {
          admin_role: string | null;
          admin_suspended: boolean | null;
          avatar: string | null;
          banned_until: string | null;
          created_at: string;
          current_period_end: string | null;
          email: string | null;
          id: string;
          last_sign_in_at: string | null;
          name: string | null;
          plan_name: string | null;
          plan_price: number | null;
          plan_slug: string | null;
          subscription_status: string | null;
          total_count: number;
        }[];
      };
      admin_plan_distribution: {
        Args: never;
        Returns: { plan_name: string; plan_slug: string; subscribers: number }[];
      };
      admin_revenue_series: {
        Args: { _days?: number };
        Returns: { day: string; payments_count: number; revenue: number }[];
      };
      admin_subscription_events_series: {
        Args: { _days?: number };
        Returns: { cancellations: number; day: string; new_subscriptions: number }[];
      };
      admin_users_growth: {
        Args: { _days?: number };
        Returns: { day: string; new_users: number }[];
      };
      consume_credit: {
        Args: { _description?: string; _operation_id: string; _tool_id: string };
        Returns: Json;
      };
      current_admin_role: { Args: never; Returns: string };
      ensure_super_admin: { Args: { _user_id: string }; Returns: undefined };
      get_credit_state: { Args: never; Returns: Json };
      grant_starter_bonus: {
        Args: { _amount?: number; _user_id: string };
        Returns: boolean;
      };
      is_feature_enabled: {
        Args: { _key: string; _plan_slug?: string; _user_id?: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
