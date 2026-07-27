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
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          actor_role: string | null
          affected_records: Json
          created_at: string
          id: string
          notes: string | null
          reset_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          actor_role?: string | null
          affected_records?: Json
          created_at?: string
          id?: string
          notes?: string | null
          reset_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          actor_role?: string | null
          affected_records?: Json
          created_at?: string
          id?: string
          notes?: string | null
          reset_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_messages: {
        Row: {
          body_text: string | null
          cc_emails: string[]
          created_at: string
          creator_id: string | null
          direction: string
          from_email: string | null
          from_name: string | null
          gmail_message_id: string
          gmail_thread_id: string | null
          has_attachments: boolean
          id: string
          label_ids: string[]
          sent_at: string | null
          snippet: string | null
          subject: string | null
          to_emails: string[]
          user_id: string
        }
        Insert: {
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          creator_id?: string | null
          direction: string
          from_email?: string | null
          from_name?: string | null
          gmail_message_id: string
          gmail_thread_id?: string | null
          has_attachments?: boolean
          id?: string
          label_ids?: string[]
          sent_at?: string | null
          snippet?: string | null
          subject?: string | null
          to_emails?: string[]
          user_id: string
        }
        Update: {
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          creator_id?: string | null
          direction?: string
          from_email?: string | null
          from_name?: string | null
          gmail_message_id?: string
          gmail_thread_id?: string | null
          has_attachments?: boolean
          id?: string
          label_ids?: string[]
          sent_at?: string | null
          snippet?: string | null
          subject?: string | null
          to_emails?: string[]
          user_id?: string
        }
        Relationships: []
      }
      gmail_poll_state: {
        Row: {
          email_address: string | null
          label_ids: Json
          last_error_at: string | null
          last_error_reason: string | null
          last_error_status: number | null
          last_history_id: string | null
          last_polled_at: string | null
          last_success_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          email_address?: string | null
          label_ids?: Json
          last_error_at?: string | null
          last_error_reason?: string | null
          last_error_status?: number | null
          last_history_id?: string | null
          last_polled_at?: string | null
          last_success_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          email_address?: string | null
          label_ids?: Json
          last_error_at?: string | null
          last_error_reason?: string | null
          last_error_status?: number | null
          last_history_id?: string | null
          last_polled_at?: string | null
          last_success_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_send_errors: {
        Row: {
          action: string
          created_at: string
          creator_id: string | null
          creator_name: string | null
          error_reason: string | null
          http_status: number | null
          id: string
          recipient: string | null
          sender_email: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          creator_id?: string | null
          creator_name?: string | null
          error_reason?: string | null
          http_status?: number | null
          id?: string
          recipient?: string | null
          sender_email?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          creator_id?: string | null
          creator_name?: string | null
          error_reason?: string | null
          http_status?: number | null
          id?: string
          recipient?: string | null
          sender_email?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen_at: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_seen_at?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_prospects: {
        Row: {
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          imported_by: string | null
          normalized_domain: string
          notes: string | null
          phone: string | null
          raw_row: Json | null
          source: string | null
          stage: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          imported_by?: string | null
          normalized_domain: string
          notes?: string | null
          phone?: string | null
          raw_row?: Json | null
          source?: string | null
          stage?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          imported_by?: string | null
          normalized_domain?: string
          notes?: string | null
          phone?: string | null
          raw_row?: Json | null
          source?: string | null
          stage?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      team_role_assignments: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "executive"
        | "research_manager"
        | "partnership_manager"
        | "partnership_coordinator"
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
      app_role: [
        "executive",
        "research_manager",
        "partnership_manager",
        "partnership_coordinator",
      ],
    },
  },
} as const
