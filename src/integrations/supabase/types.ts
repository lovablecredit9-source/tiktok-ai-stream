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
      ai_responses: {
        Row: {
          answer: string
          created_at: string
          event_id: string | null
          id: string
          question: string
          session_id: string | null
          user_id: string
          username: string
        }
        Insert: {
          answer: string
          created_at?: string
          event_id?: string | null
          id?: string
          question: string
          session_id?: string | null
          user_id?: string
          username: string
        }
        Update: {
          answer?: string
          created_at?: string
          event_id?: string | null
          id?: string
          question?: string
          session_id?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "live_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          base_url: string | null
          cooldown_seconds: number
          encrypted_api_key: string | null
          has_api_key: boolean
          id: string
          max_requests_per_minute: number
          max_tokens: number
          model: string
          provider: string
          system_prompt: string
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_url?: string | null
          cooldown_seconds?: number
          encrypted_api_key?: string | null
          has_api_key?: boolean
          id?: string
          max_requests_per_minute?: number
          max_tokens?: number
          model?: string
          provider?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          base_url?: string | null
          cooldown_seconds?: number
          encrypted_api_key?: string | null
          has_api_key?: boolean
          id?: string
          max_requests_per_minute?: number
          max_tokens?: number
          model?: string
          provider?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          ai_enabled: boolean
          coin_to_point: number
          id: string
          min_coins_popup: number
          point_comment: number
          point_correct_answer: number
          point_follow: number
          provider_endpoint: string | null
          provider_name: string
          tts_auto_read: boolean
          tts_enabled: boolean
          tts_pitch: number
          tts_rate: number
          tts_voice: string | null
          tts_volume: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_enabled?: boolean
          coin_to_point?: number
          id?: string
          min_coins_popup?: number
          point_comment?: number
          point_correct_answer?: number
          point_follow?: number
          provider_endpoint?: string | null
          provider_name?: string
          tts_auto_read?: boolean
          tts_enabled?: boolean
          tts_pitch?: number
          tts_rate?: number
          tts_voice?: string | null
          tts_volume?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_enabled?: boolean
          coin_to_point?: number
          id?: string
          min_coins_popup?: number
          point_comment?: number
          point_correct_answer?: number
          point_follow?: number
          provider_endpoint?: string | null
          provider_name?: string
          tts_auto_read?: boolean
          tts_enabled?: boolean
          tts_pitch?: number
          tts_rate?: number
          tts_voice?: string | null
          tts_volume?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_config: {
        Row: {
          animation: string
          animation_duration: number
          category: string
          coins: number
          emoji: string | null
          enabled: boolean
          gift_alias: string | null
          gift_id: string
          gift_name: string
          icon_url: string | null
          id: string
          multiplier: number
          points: number
          updated_at: string
          vip_level: number
        }
        Insert: {
          animation?: string
          animation_duration?: number
          category?: string
          coins?: number
          emoji?: string | null
          enabled?: boolean
          gift_alias?: string | null
          gift_id: string
          gift_name: string
          icon_url?: string | null
          id?: string
          multiplier?: number
          points?: number
          updated_at?: string
          vip_level?: number
        }
        Update: {
          animation?: string
          animation_duration?: number
          category?: string
          coins?: number
          emoji?: string | null
          enabled?: boolean
          gift_alias?: string | null
          gift_id?: string
          gift_name?: string
          icon_url?: string | null
          id?: string
          multiplier?: number
          points?: number
          updated_at?: string
          vip_level?: number
        }
        Relationships: []
      }
      live_events: {
        Row: {
          avatar: string | null
          comment: string | null
          created_at: string
          event_key: string
          event_type: string
          gift_category: string | null
          gift_coins: number
          gift_count: number
          gift_id: string | null
          gift_name: string | null
          id: string
          is_answered: boolean
          is_question: boolean
          nickname: string | null
          points: number
          raw_data: Json | null
          session_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar?: string | null
          comment?: string | null
          created_at?: string
          event_key: string
          event_type: string
          gift_category?: string | null
          gift_coins?: number
          gift_count?: number
          gift_id?: string | null
          gift_name?: string | null
          id?: string
          is_answered?: boolean
          is_question?: boolean
          nickname?: string | null
          points?: number
          raw_data?: Json | null
          session_id: string
          user_id?: string
          username: string
        }
        Update: {
          avatar?: string | null
          comment?: string | null
          created_at?: string
          event_key?: string
          event_type?: string
          gift_category?: string | null
          gift_coins?: number
          gift_count?: number
          gift_id?: string | null
          gift_name?: string | null
          id?: string
          is_answered?: boolean
          is_question?: boolean
          nickname?: string | null
          points?: number
          raw_data?: Json | null
          session_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          account_username: string
          created_at: string
          ended_at: string | null
          id: string
          live_url: string | null
          nickname: string | null
          provider: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          account_username?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          live_url?: string | null
          nickname?: string | null
          provider?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Update: {
          account_username?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          live_url?: string | null
          nickname?: string | null
          provider?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          avatar: string | null
          comment_count: number
          correct_answers: number
          created_at: string
          follow_count: number
          gift_coins: number
          gift_count: number
          id: string
          nickname: string | null
          score: number
          session_id: string
          updated_at: string
          user_id: string
          username: string
          wrong_answers: number
        }
        Insert: {
          avatar?: string | null
          comment_count?: number
          correct_answers?: number
          created_at?: string
          follow_count?: number
          gift_coins?: number
          gift_count?: number
          id?: string
          nickname?: string | null
          score?: number
          session_id: string
          updated_at?: string
          user_id?: string
          username: string
          wrong_answers?: number
        }
        Update: {
          avatar?: string | null
          comment_count?: number
          correct_answers?: number
          created_at?: string
          follow_count?: number
          gift_coins?: number
          gift_count?: number
          id?: string
          nickname?: string | null
          score?: number
          session_id?: string
          updated_at?: string
          user_id?: string
          username?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_correct: boolean
          points: number
          question_id: string
          session_id: string | null
          user_id: string
          username: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points?: number
          question_id: string
          session_id?: string | null
          user_id?: string
          username: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points?: number
          question_id?: string
          session_id?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          is_active: boolean
          mode: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question: string
          session_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question: string
          session_id?: string | null
          title?: string | null
          user_id?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question?: string
          session_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          session_id: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          session_id?: string | null
          source?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          session_id?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
