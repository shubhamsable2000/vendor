export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      email_messages: {
        Row: {
          id: number
          sender: string
          text: string
          thread_id: number
          timestamp: string
          type: string | null
        }
        Insert: {
          id?: number
          sender: string
          text: string
          thread_id: number
          timestamp?: string
          type?: string | null
        }
        Update: {
          id?: number
          sender?: string
          text?: string
          thread_id?: number
          timestamp?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_thread"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_replies: {
        Row: {
          html_content: string | null
          id: string
          received_at: string
          rfx_id: number
          sender_email: string
          subject: string
          text_content: string | null
          thread_id: number
          tracking_id: string
          type: string | null
          user_id: string
        }
        Insert: {
          html_content?: string | null
          id?: string
          received_at?: string
          rfx_id: number
          sender_email: string
          subject: string
          text_content?: string | null
          thread_id: number
          tracking_id: string
          type?: string | null
          user_id: string
        }
        Update: {
          html_content?: string | null
          id?: string
          received_at?: string
          rfx_id?: number
          sender_email?: string
          subject?: string
          text_content?: string | null
          thread_id?: number
          tracking_id?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_threads: {
        Row: {
          created_at: string
          id: number
          rfx_id: number
          status: string
          subject: string
          unread: boolean
          updated_at: string
          vendor_email: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string
          id?: number
          rfx_id: number
          status?: string
          subject: string
          unread?: boolean
          updated_at?: string
          vendor_email?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string
          id?: number
          rfx_id?: number
          status?: string
          subject?: string
          unread?: boolean
          updated_at?: string
          vendor_email?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          id: string
          recipient_email: string
          rfx_id: number
          sent_at: string
          subject: string
          thread_id: number
          tracking_id: string
          type: string | null
          user_id: string
        }
        Insert: {
          id?: string
          recipient_email: string
          rfx_id: number
          sent_at?: string
          subject: string
          thread_id: number
          tracking_id: string
          type?: string | null
          user_id: string
        }
        Update: {
          id?: string
          recipient_email?: string
          rfx_id?: number
          sent_at?: string
          subject?: string
          thread_id?: number
          tracking_id?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_auth_providers: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          provider: string
          provider_user_email: string | null
          provider_user_id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          provider?: string
          provider_user_email?: string | null
          provider_user_id: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          provider_user_email?: string | null
          provider_user_id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      negotiation_settings: {
        Row: {
          auto_negotiate: boolean
          created_at: string
          id: string
          max_budget: number
          min_budget: number
          notes: string | null
          rfx_id: number | null
          status: string
          target_budget: number
          thread_id: number
          updated_at: string
        }
        Insert: {
          auto_negotiate?: boolean
          created_at?: string
          id?: string
          max_budget: number
          min_budget: number
          notes?: string | null
          rfx_id?: number | null
          status?: string
          target_budget: number
          thread_id: number
          updated_at?: string
        }
        Update: {
          auto_negotiate?: boolean
          created_at?: string
          id?: string
          max_budget?: number
          min_budget?: number
          notes?: string | null
          rfx_id?: number | null
          status?: string
          target_budget?: number
          thread_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_settings_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: true
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      nylas_auth: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nylas_oauth_states: {
        Row: {
          created_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_negotiation_settings: {
        Args: {
          min_budget_val: number
          max_budget_val: number
          target_budget_val: number
          thread_id_val: number
          notes_val?: string
        }
        Returns: string
      }
      get_all_negotiation_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          auto_negotiate: boolean
          created_at: string
          id: string
          max_budget: number
          min_budget: number
          notes: string | null
          rfx_id: number | null
          status: string
          target_budget: number
          thread_id: number
          updated_at: string
        }[]
      }
      process_negotiation_response: {
        Args: { thread_id_val: number; reply_id_val: string }
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
