export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          internal_notes: string | null;
          platform_role: string;
          suspended_at: string | null;
          suspended_reason: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          internal_notes?: string | null;
          platform_role?: string;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          internal_notes?: string | null;
          platform_role?: string;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          default_plan_id: string | null;
          favicon_url: string | null;
          global_announcement: string | null;
          id: number;
          landing_headline: string;
          landing_subheadline: string;
          logo_url: string | null;
          maintenance_message: string;
          maintenance_mode: boolean;
          primary_color: string;
          product_description: string;
          product_name: string;
          secondary_color: string;
          signups_disabled_message: string;
          signups_enabled: boolean;
          support_email: string | null;
          trial_days: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          default_plan_id?: string | null;
          favicon_url?: string | null;
          global_announcement?: string | null;
          id?: number;
          landing_headline?: string;
          landing_subheadline?: string;
          logo_url?: string | null;
          maintenance_message?: string;
          maintenance_mode?: boolean;
          primary_color?: string;
          product_description?: string;
          product_name?: string;
          secondary_color?: string;
          signups_disabled_message?: string;
          signups_enabled?: boolean;
          support_email?: string | null;
          trial_days?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          default_plan_id?: string | null;
          favicon_url?: string | null;
          global_announcement?: string | null;
          id?: number;
          landing_headline?: string;
          landing_subheadline?: string;
          logo_url?: string | null;
          maintenance_message?: string;
          maintenance_mode?: boolean;
          primary_color?: string;
          product_description?: string;
          product_name?: string;
          secondary_color?: string;
          signups_disabled_message?: string;
          signups_enabled?: boolean;
          support_email?: string | null;
          trial_days?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      platform_integrations: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_password: string | null;
          enabled: boolean;
          field_mapping: Json;
          id: string;
          kind: string;
          name: string;
          provider_slug: string;
          signature_location: Json | null;
          signature_secret: string | null;
          token: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_password?: string | null;
          enabled?: boolean;
          field_mapping?: Json;
          id?: string;
          kind: string;
          name: string;
          provider_slug: string;
          signature_location?: Json | null;
          signature_secret?: string | null;
          token?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_password?: string | null;
          enabled?: boolean;
          field_mapping?: Json;
          id?: string;
          kind?: string;
          name?: string;
          provider_slug?: string;
          signature_location?: Json | null;
          signature_secret?: string | null;
          token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_integration_events: {
        Row: {
          created_at: string;
          error_message: string | null;
          event_key: string | null;
          id: string;
          integration_id: string;
          outcome: string | null;
          payload: Json;
          processed_at: string | null;
          resolved: Json | null;
          source_ip: string | null;
          status: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          event_key?: string | null;
          id?: string;
          integration_id: string;
          outcome?: string | null;
          payload: Json;
          processed_at?: string | null;
          resolved?: Json | null;
          source_ip?: string | null;
          status?: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          event_key?: string | null;
          id?: string;
          integration_id?: string;
          outcome?: string | null;
          payload?: Json;
          processed_at?: string | null;
          resolved?: Json | null;
          source_ip?: string | null;
          status?: string;
          workspace_id?: string | null;
        };
        Relationships: [];
      };
      platform_audit_logs: {
        Row: {
          action: string;
          actor_email: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_label: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
          summary: string;
        };
        Insert: {
          action: string;
          actor_email: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
          summary: string;
        };
        Update: {
          action?: string;
          actor_email?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
          summary?: string;
        };
        Relationships: [];
      };
      quiz_steps: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          quiz_id: string;
          settings: Json;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          position: number;
          quiz_id: string;
          settings?: Json;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position?: number;
          quiz_id?: string;
          settings?: Json;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      quiz_widgets: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          position: number;
          step_id: string;
          type: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          position: number;
          step_id: string;
          type: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          position?: number;
          step_id?: string;
          type?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      quiz_daily_metrics: {
        Row: {
          quiz_id: string;
          metric_date: string;
          views: number;
          starts: number;
          completions: number;
        };
        Insert: {
          quiz_id: string;
          metric_date: string;
          views?: number;
          starts?: number;
          completions?: number;
        };
        Update: {
          quiz_id?: string;
          metric_date?: string;
          views?: number;
          starts?: number;
          completions?: number;
        };
        Relationships: [];
      };
      quiz_step_metrics: {
        Row: {
          quiz_id: string;
          step_id: string;
          views: number;
        };
        Insert: {
          quiz_id: string;
          step_id: string;
          views?: number;
        };
        Update: {
          quiz_id?: string;
          step_id?: string;
          views?: number;
        };
        Relationships: [];
      };
      quiz_share_links: {
        Row: {
          id: string;
          quiz_id: string;
          workspace_id: string;
          share_token: string;
          enabled: boolean;
          snapshot: Json;
          schema_version: number;
          source_title: string;
          import_count: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          workspace_id: string;
          share_token: string;
          enabled?: boolean;
          snapshot: Json;
          schema_version?: number;
          source_title: string;
          import_count?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          workspace_id?: string;
          share_token?: string;
          enabled?: boolean;
          snapshot?: Json;
          schema_version?: number;
          source_title?: string;
          import_count?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_folders: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          design_settings: Json;
          flow_layout: Json;
          folder_id: string | null;
          variables: Json;
          settings: Json;
          published_at: string | null;
          published_content: Json | null;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          design_settings?: Json;
          flow_layout?: Json;
          folder_id?: string | null;
          variables?: Json;
          settings?: Json;
          published_at?: string | null;
          published_content?: Json | null;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          design_settings?: Json;
          flow_layout?: Json;
          folder_id?: string | null;
          variables?: Json;
          settings?: Json;
          published_at?: string | null;
          published_content?: Json | null;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      quiz_custom_domains: {
        Row: {
          id: string;
          quiz_id: string;
          workspace_id: string;
          hostname: string;
          status: string;
          vercel_domain_id: string | null;
          verification_records: Json;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          workspace_id: string;
          hostname: string;
          status?: string;
          vercel_domain_id?: string | null;
          verification_records?: Json;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          workspace_id?: string;
          hostname?: string;
          status?: string;
          vercel_domain_id?: string | null;
          verification_records?: Json;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: string;
          token: string;
          invited_by: string;
          status: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: string;
          token?: string;
          invited_by: string;
          status?: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: string;
          token?: string;
          invited_by?: string;
          status?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          limits: Json;
          price_cents: number | null;
          stripe_price_id: string | null;
          checkout_url: string | null;
          external_references: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          limits: Json;
          price_cents?: number | null;
          stripe_price_id?: string | null;
          checkout_url?: string | null;
          external_references?: string[];
          is_active?: boolean;
          sort_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          limits?: Json;
          price_cents?: number | null;
          stripe_price_id?: string | null;
          checkout_url?: string | null;
          external_references?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_payments: {
        Row: {
          id: string;
          workspace_id: string;
          plan_id: string;
          external_payment_id: string;
          provider: string;
          amount_cents: number;
          payment_method: string;
          period_start: string;
          period_end: string;
          status: string;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          plan_id: string;
          external_payment_id: string;
          provider?: string;
          amount_cents: number;
          payment_method: string;
          period_start: string;
          period_end: string;
          status?: string;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          plan_id?: string;
          external_payment_id?: string;
          provider?: string;
          amount_cents?: number;
          payment_method?: string;
          period_start?: string;
          period_end?: string;
          status?: string;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          plan_id: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          external_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          plan_id: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          external_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          plan_id?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          external_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      accept_workspace_invitation: {
        Args: { invite_token: string };
        Returns: string;
      };
      process_payment_webhook: {
        Args: { payload: Json };
        Returns: Json;
      };
      process_payment_refund: {
        Args: { payload: Json };
        Returns: Json;
      };
      expire_overdue_subscriptions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      is_workspace_admin: { Args: { ws_id: string }; Returns: boolean };
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean };
      integration_apply_mapping: {
        Args: { p_mapping: Json; p_payload: Json; p_kind?: string | null };
        Returns: Json;
      };
      integration_ingest_event: {
        Args: { p_token: string; p_payload: Json; p_source_ip?: string | null };
        Returns: Json;
      };
      integration_finalize_purchase: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: Json;
      };
      integration_mark_failed: {
        Args: { p_event_id: string; p_message: string };
        Returns: undefined;
      };
      integration_reprocess_event: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      purge_old_integration_events: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      is_platform_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_platform_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_user_workspace_role: { Args: { ws_id: string }; Returns: string };
      record_quiz_analytics: {
        Args: {
          p_quiz_id: string;
          p_event: string;
          p_step_id?: string | null;
        };
        Returns: undefined;
      };
      get_quiz_statistics: {
        Args: {
          p_quiz_id: string;
          p_days?: number;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
