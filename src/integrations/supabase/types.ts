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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      barcode_registry: {
        Row: {
          barcode: string
          barcode_type: string
          created_at: string
          entity_id: string
          entity_type: string
          format: string
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          barcode: string
          barcode_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          format?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          barcode?: string
          barcode_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          format?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          category_id: number | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
      company_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      employee_profiles: {
        Row: {
          achievements: Json | null
          avg_repair_time_hours: number | null
          badges: Json | null
          bonus_threshold: number | null
          commission_rate: number | null
          cost_savings_monthly: number | null
          created_at: string
          current_bonus_earned: number | null
          current_monthly_sales: number | null
          current_quarterly_sales: number | null
          current_yearly_sales: number | null
          customer_satisfaction_rating: number | null
          employee_id: string
          goal_end_date: string | null
          goal_start_date: string | null
          id: string
          inventory_accuracy_rate: number | null
          milestones: Json | null
          monthly_sales_target: number | null
          performance_score: number | null
          quarterly_sales_target: number | null
          repair_success_rate: number | null
          repairs_completed_monthly: number | null
          stock_turnover_rate: number | null
          updated_at: string
          user_id: string
          yearly_sales_target: number | null
        }
        Insert: {
          achievements?: Json | null
          avg_repair_time_hours?: number | null
          badges?: Json | null
          bonus_threshold?: number | null
          commission_rate?: number | null
          cost_savings_monthly?: number | null
          created_at?: string
          current_bonus_earned?: number | null
          current_monthly_sales?: number | null
          current_quarterly_sales?: number | null
          current_yearly_sales?: number | null
          customer_satisfaction_rating?: number | null
          employee_id: string
          goal_end_date?: string | null
          goal_start_date?: string | null
          id?: string
          inventory_accuracy_rate?: number | null
          milestones?: Json | null
          monthly_sales_target?: number | null
          performance_score?: number | null
          quarterly_sales_target?: number | null
          repair_success_rate?: number | null
          repairs_completed_monthly?: number | null
          stock_turnover_rate?: number | null
          updated_at?: string
          user_id: string
          yearly_sales_target?: number | null
        }
        Update: {
          achievements?: Json | null
          avg_repair_time_hours?: number | null
          badges?: Json | null
          bonus_threshold?: number | null
          commission_rate?: number | null
          cost_savings_monthly?: number | null
          created_at?: string
          current_bonus_earned?: number | null
          current_monthly_sales?: number | null
          current_quarterly_sales?: number | null
          current_yearly_sales?: number | null
          customer_satisfaction_rating?: number | null
          employee_id?: string
          goal_end_date?: string | null
          goal_start_date?: string | null
          id?: string
          inventory_accuracy_rate?: number | null
          milestones?: Json | null
          monthly_sales_target?: number | null
          performance_score?: number | null
          quarterly_sales_target?: number | null
          repair_success_rate?: number | null
          repairs_completed_monthly?: number | null
          stock_turnover_rate?: number | null
          updated_at?: string
          user_id?: string
          yearly_sales_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      models: {
        Row: {
          brand_id: string
          category_id: number | null
          color_variants: string[] | null
          created_at: string
          id: string
          name: string
          release_year: number | null
          storage_variants: string[] | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id?: number | null
          color_variants?: string[] | null
          created_at?: string
          id?: string
          name: string
          release_year?: number | null
          storage_variants?: string[] | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: number | null
          color_variants?: string[] | null
          created_at?: string
          id?: string
          name?: string
          release_year?: number | null
          storage_variants?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_logs: {
        Row: {
          achievement_data: Json | null
          achievement_type: string | null
          created_at: string
          employee_profile_id: string
          id: string
          metric_target: number | null
          metric_type: string
          metric_value: number
          notes: string | null
          period_end: string
          period_start: string
          period_type: string
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type?: string | null
          created_at?: string
          employee_profile_id: string
          id?: string
          metric_target?: number | null
          metric_type: string
          metric_value: number
          notes?: string | null
          period_end: string
          period_start: string
          period_type?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string | null
          created_at?: string
          employee_profile_id?: string
          id?: string
          metric_target?: number | null
          metric_type?: string
          metric_value?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_logs_employee_profile_id_fkey"
            columns: ["employee_profile_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
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
      product_units: {
        Row: {
          barcode: string | null
          battery_level: number | null
          color: string | null
          created_at: string
          id: string
          max_price: number | null
          min_price: number | null
          price: number | null
          product_id: string
          ram: number | null
          serial_number: string
          status: string
          storage: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          battery_level?: number | null
          color?: string | null
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number | null
          price?: number | null
          product_id: string
          ram?: number | null
          serial_number: string
          status?: string
          storage?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          battery_level?: number | null
          color?: string | null
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number | null
          price?: number | null
          product_id?: string
          ram?: number | null
          serial_number?: string
          status?: string
          storage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
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
      rate_limit_attempts: {
        Row: {
          attempt_type: string
          blocked_until: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          user_email: string | null
        }
        Insert: {
          attempt_type: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          user_email?: string | null
        }
        Update: {
          attempt_type?: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_email?: string | null
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
          bank_transfer_amount: number | null
          card_amount: number | null
          cash_amount: number | null
          client_id: string | null
          created_at: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          notes: string | null
          payment_method: string
          payment_type: string | null
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
          bank_transfer_amount?: number | null
          card_amount?: number | null
          cash_amount?: number | null
          client_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          payment_method: string
          payment_type?: string | null
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
          bank_transfer_amount?: number | null
          card_amount?: number | null
          cash_amount?: number | null
          client_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_type?: string | null
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
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      admin_remove_user_role: {
        Args: {
          remove_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      auto_block_suspicious_ip: {
        Args: { client_ip: unknown }
        Returns: boolean
      }
      calculate_employee_bonuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_view_salary: {
        Args: { target_employee_id: string }
        Returns: boolean
      }
      check_account_lockout: {
        Args: { user_email: string }
        Returns: Json
      }
      check_failed_auth_attempts: {
        Args: { user_email: string }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          attempt_type: string
          client_ip: unknown
          max_attempts?: number
          window_minutes?: number
        }
        Returns: Json
      }
      cleanup_invalid_auth_state: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_security_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_concurrent_sessions: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      detect_suspicious_session_activity: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      enhanced_input_validation: {
        Args: {
          input_text: string
          max_length?: number
          validation_type: string
        }
        Returns: Json
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
      get_employee_profile: {
        Args: { target_user_id?: string }
        Returns: {
          achievements: Json
          badges: Json
          commission_rate: number
          current_bonus_earned: number
          current_monthly_sales: number
          current_quarterly_sales: number
          current_yearly_sales: number
          customer_satisfaction_rating: number
          employee_id: string
          id: string
          monthly_sales_target: number
          performance_score: number
          quarterly_sales_target: number
          user_id: string
          yearly_sales_target: number
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ip_blocked: {
        Args: { client_ip: unknown }
        Returns: boolean
      }
      sanitize_and_validate_input: {
        Args: { input_text: string; input_type: string; max_length?: number }
        Returns: Json
      }
      validate_product_stock: {
        Args: { product_items: Json }
        Returns: boolean
      }
      validate_sale_serial_numbers: {
        Args: { sale_items_data: Json }
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
        | "super_admin"
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
        "super_admin",
      ],
    },
  },
} as const
