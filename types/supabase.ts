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
      agent_assignment_metrics: {
        Row: {
          agent_id: string | null
          assignment_timestamp: string | null
          confidence: number | null
          created_at: string | null
          id: string
          predicted_resolution_time: unknown | null
          reasoning: string | null
          skill_match_score: number | null
          ticket_id: string | null
          updated_at: string | null
          workload_at_assignment: number | null
        }
        Insert: {
          agent_id?: string | null
          assignment_timestamp?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          predicted_resolution_time?: unknown | null
          reasoning?: string | null
          skill_match_score?: number | null
          ticket_id?: string | null
          updated_at?: string | null
          workload_at_assignment?: number | null
        }
        Update: {
          agent_id?: string | null
          assignment_timestamp?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          predicted_resolution_time?: unknown | null
          reasoning?: string | null
          skill_match_score?: number | null
          ticket_id?: string | null
          updated_at?: string | null
          workload_at_assignment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_assignment_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_assignment_metrics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance_metrics: {
        Row: {
          agent_id: string | null
          complexity_score: number | null
          created_at: string | null
          customer_satisfaction: number | null
          id: string
          resolution_quality_score: number | null
          resolution_time: unknown | null
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          complexity_score?: number | null
          created_at?: string | null
          customer_satisfaction?: number | null
          id?: string
          resolution_quality_score?: number | null
          resolution_time?: unknown | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          complexity_score?: number | null
          created_at?: string | null
          customer_satisfaction?: number | null
          id?: string
          resolution_quality_score?: number | null
          resolution_time?: unknown | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_performance_metrics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_status: string | null
          avatar_url: string | null
          created_at: string | null
          current_workload: number | null
          email: string | null
          expertise: string[] | null
          full_name: string | null
          id: string
          is_profile_setup: boolean
          max_workload: number | null
          role: Database["public"]["Enums"]["user_role"]
          skill_levels: Json | null
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          avatar_url?: string | null
          created_at?: string | null
          current_workload?: number | null
          email?: string | null
          expertise?: string[] | null
          full_name?: string | null
          id: string
          is_profile_setup?: boolean
          max_workload?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          skill_levels?: Json | null
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          avatar_url?: string | null
          created_at?: string | null
          current_workload?: number | null
          email?: string | null
          expertise?: string[] | null
          full_name?: string | null
          id?: string
          is_profile_setup?: boolean
          max_workload?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          skill_levels?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_routing_metrics: {
        Row: {
          confidence: number | null
          created_at: string | null
          estimated_workload: number | null
          id: string
          reasoning: string | null
          required_capabilities: string[] | null
          routing_timestamp: string | null
          team_id: string | null
          ticket_id: string | null
          updated_at: string | null
          workload_at_time: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          estimated_workload?: number | null
          id?: string
          reasoning?: string | null
          required_capabilities?: string[] | null
          routing_timestamp?: string | null
          team_id?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          workload_at_time?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          estimated_workload?: number | null
          id?: string
          reasoning?: string | null
          required_capabilities?: string[] | null
          routing_timestamp?: string | null
          team_id?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          workload_at_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_routing_metrics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_routing_metrics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          capabilities: string[] | null
          created_at: string | null
          current_workload: number | null
          description: string | null
          id: string
          max_workload: number | null
          name: string
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          capabilities?: string[] | null
          created_at?: string | null
          current_workload?: number | null
          description?: string | null
          id?: string
          max_workload?: number | null
          name: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          capabilities?: string[] | null
          created_at?: string | null
          current_workload?: number | null
          description?: string | null
          id?: string
          max_workload?: number | null
          name?: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          ticket_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          ticket_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          ticket_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_research_findings: {
        Row: {
          complexity_score: number | null
          created_at: string | null
          frequency_score: number | null
          id: string
          impact_score: number | null
          patterns: Json | null
          research_timestamp: string | null
          similar_tickets: Json | null
          suggested_solutions: string[] | null
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          complexity_score?: number | null
          created_at?: string | null
          frequency_score?: number | null
          id?: string
          impact_score?: number | null
          patterns?: Json | null
          research_timestamp?: string | null
          similar_tickets?: Json | null
          suggested_solutions?: string[] | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          complexity_score?: number | null
          created_at?: string | null
          frequency_score?: number | null
          id?: string
          impact_score?: number | null
          patterns?: Json | null
          research_timestamp?: string | null
          similar_tickets?: Json | null
          suggested_solutions?: string[] | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_research_findings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          ai_classification_timestamp: string | null
          ai_confidence: number | null
          ai_suggested_category:
            | Database["public"]["Enums"]["ticket_category"]
            | null
          assigned_to: string | null
          assignment_attempts: number | null
          assignment_confidence: number | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string | null
          created_by: string | null
          created_on_behalf: boolean | null
          customer_id: string | null
          description: string | null
          id: string
          last_assignment_timestamp: string | null
          last_routing_timestamp: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          routing_attempts: number | null
          routing_confidence: number | null
          status: Database["public"]["Enums"]["ticket_status"]
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_classification_timestamp?: string | null
          ai_confidence?: number | null
          ai_suggested_category?:
            | Database["public"]["Enums"]["ticket_category"]
            | null
          assigned_to?: string | null
          assignment_attempts?: number | null
          assignment_confidence?: number | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          created_by?: string | null
          created_on_behalf?: boolean | null
          customer_id?: string | null
          description?: string | null
          id?: string
          last_assignment_timestamp?: string | null
          last_routing_timestamp?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          routing_attempts?: number | null
          routing_confidence?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_classification_timestamp?: string | null
          ai_confidence?: number | null
          ai_suggested_category?:
            | Database["public"]["Enums"]["ticket_category"]
            | null
          assigned_to?: string | null
          assignment_attempts?: number | null
          assignment_confidence?: number | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          created_by?: string | null
          created_on_behalf?: boolean | null
          customer_id?: string | null
          description?: string | null
          id?: string
          last_assignment_timestamp?: string | null
          last_routing_timestamp?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          routing_attempts?: number | null
          routing_confidence?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      ticket_category:
        | "bug"
        | "feature_request"
        | "support"
        | "question"
        | "documentation"
        | "enhancement"
        | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_routing_status: "pending" | "in_progress" | "completed" | "failed"
      ticket_status: "new" | "open" | "in_progress" | "resolved" | "closed"
      user_role: "admin" | "agent" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
