export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          status: string
          tax_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          email: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          phone: string | null
          position: string | null
          profile_id: string | null
          salary: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          first_name: string
          hire_date?: string
          id?: string
          last_name: string
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          created_at: string
          id: string
          priority: number
          product_id: string
          recommendation_type: string
          recommended_product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: number
          product_id: string
          recommendation_type?: string
          recommended_product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: number
          product_id?: string
          recommendation_type?: string
          recommended_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_recommendations_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_recommendations_recommended"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          battery_level: number | null
          brand: string
          category_id: number | null
          created_at: string | null
          description: string | null
          has_serial: boolean | null
          id: string
          max_price: number | null
          min_price: number | null
          model: string
          price: number
          serial_numbers: string[] | null
          stock: number
          supplier: string | null
          threshold: number
          updated_at: string | null
          year: number | null
        }
        Insert: {
          barcode?: string | null
          battery_level?: number | null
          brand: string
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          has_serial?: boolean | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          model: string
          price: number
          serial_numbers?: string[] | null
          stock?: number
          supplier?: string | null
          threshold?: number
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          barcode?: string | null
          battery_level?: number | null
          brand?: string
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          has_serial?: boolean | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          model?: string
          price?: number
          serial_numbers?: string[] | null
          stock?: number
          supplier?: string | null
          threshold?: number
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Relationships: []
      }
      repair_parts: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          repair_id: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          repair_id: string
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          repair_id?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_parts_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
        ]
      }
      repairs: {
        Row: {
          actual_completion_date: string | null
          client_id: string | null
          cost: number
          created_at: string
          device: string
          estimated_completion_date: string | null
          id: string
          imei: string | null
          issue: string
          labor_cost: number
          notes: string | null
          parts_cost: number
          priority: string
          repair_number: string
          status: string
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          client_id?: string | null
          cost?: number
          created_at?: string
          device: string
          estimated_completion_date?: string | null
          id?: string
          imei?: string | null
          issue: string
          labor_cost?: number
          notes?: string | null
          parts_cost?: number
          priority?: string
          repair_number: string
          status?: string
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          client_id?: string | null
          cost?: number
          created_at?: string
          device?: string
          estimated_completion_date?: string | null
          id?: string
          imei?: string | null
          issue?: string
          labor_cost?: number
          notes?: string | null
          parts_cost?: number
          priority?: string
          repair_number?: string
          status?: string
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repairs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          serial_number: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          sale_id: string
          serial_number?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          serial_number?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          sale_date: string
          sale_number: string
          salesperson_id: string
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: string
          sale_date?: string
          sale_number: string
          salesperson_id: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          sale_date?: string
          sale_number?: string
          salesperson_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      supplier_transaction_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          total_cost: number
          transaction_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          total_cost: number
          transaction_id: string
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          total_cost?: number
          transaction_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "supplier_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_transactions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          status: string
          supplier_id: string
          total_amount: number
          transaction_date: string
          transaction_number: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          supplier_id: string
          total_amount?: number
          transaction_date?: string
          transaction_number: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          transaction_date?: string
          transaction_number?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      admin_remove_user_role: {
        Args: {
          target_user_id: string
          remove_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      admin_update_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      generate_repair_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sale_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_transaction_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      validate_product_stock: {
        Args: { product_items: Json }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "inventory_manager"
        | "salesperson"
        | "technician"
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
        "admin",
        "manager",
        "inventory_manager",
        "salesperson",
        "technician",
      ],
    },
  },
} as const
