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
      brand_aliases: {
        Row: {
          alias: string
          brand_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          alias: string
          brand_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          brand_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_aliases_brand_fk"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          category_id: number | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          search_vector: unknown
          slug: string | null
          updated_at: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          search_vector?: unknown
          slug?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          search_vector?: unknown
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
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
          store_id: string
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
          store_id: string
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
          store_id?: string
          tax_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
          store_id: string
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
          store_id: string
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
          store_id?: string
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
          {
            foreignKeyName: "employees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      model_aliases: {
        Row: {
          alias: string
          brand_id: string
          created_at: string
          id: string
          model_id: string
          updated_at: string
        }
        Insert: {
          alias: string
          brand_id: string
          created_at?: string
          id?: string
          model_id: string
          updated_at?: string
        }
        Update: {
          alias?: string
          brand_id?: string
          created_at?: string
          id?: string
          model_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_aliases_brand_fk"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_aliases_model_fk"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
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
          search_vector: unknown
          slug: string | null
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
          search_vector?: unknown
          slug?: string | null
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
          search_vector?: unknown
          slug?: string | null
          storage_variants?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_fk"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      product_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          note: string | null
          old_data: Json | null
          operation_type: string
          product_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          note?: string | null
          old_data?: Json | null
          operation_type: string
          product_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          note?: string | null
          old_data?: Json | null
          operation_type?: string
          product_id?: string
        }
        Relationships: []
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
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
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
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
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
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
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
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
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
      product_unit_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          note: string | null
          old_data: Json | null
          operation_type: string
          product_id: string
          product_unit_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          note?: string | null
          old_data?: Json | null
          operation_type: string
          product_id: string
          product_unit_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          note?: string | null
          old_data?: Json | null
          operation_type?: string
          product_id?: string
          product_unit_id?: string
        }
        Relationships: []
      }
      product_units: {
        Row: {
          barcode: string | null
          battery_level: number | null
          color: string | null
          condition: string
          created_at: string
          id: string
          max_price: number | null
          min_price: number | null
          price: number | null
          product_id: string
          purchase_date: string | null
          purchase_price: number | null
          ram: number | null
          serial_number: string
          status: string
          storage: number | null
          store_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          battery_level?: number | null
          color?: string | null
          condition?: string
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number | null
          price?: number | null
          product_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          ram?: number | null
          serial_number: string
          status?: string
          storage?: number | null
          store_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          battery_level?: number | null
          color?: string | null
          condition?: string
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number | null
          price?: number | null
          product_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          ram?: number | null
          serial_number?: string
          status?: string
          storage?: number | null
          store_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_units_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_units_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          status: string
          stock: number
          store_id: string
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
          status?: string
          stock?: number
          store_id: string
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
          status?: string
          stock?: number
          store_id?: string
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
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_system_user: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_system_user?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_system_user?: boolean | null
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
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
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
          store_id: string
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
          store_id: string
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
          store_id?: string
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
            foreignKeyName: "repairs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
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
      sale_return_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          refund_amount: number
          return_condition: string
          return_id: string
          sale_item_id: string
          serial_number: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          refund_amount: number
          return_condition: string
          return_id: string
          sale_item_id: string
          serial_number?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          refund_amount?: number
          return_condition?: string
          return_id?: string
          sale_item_id?: string
          serial_number?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          refund_amount: number
          refund_method: string
          restocking_fee: number
          return_date: string
          return_number: string
          return_reason: string
          returned_by: string | null
          sale_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          refund_amount?: number
          refund_method: string
          restocking_fee?: number
          return_date?: string
          return_number: string
          return_reason: string
          returned_by?: string | null
          sale_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          refund_amount?: number
          refund_method?: string
          restocking_fee?: number
          return_date?: string
          return_number?: string
          return_reason?: string
          returned_by?: string | null
          sale_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
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
          store_id: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          vat_included: boolean
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
          store_id: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          vat_included?: boolean
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
          store_id?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          vat_included?: boolean
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
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sold_product_units: {
        Row: {
          barcode: string | null
          created_at: string
          customer_name: string | null
          id: string
          original_purchase_price: number | null
          payment_method: string | null
          product_id: string
          product_unit_id: string
          sale_id: string
          sale_item_id: string
          sale_number: string | null
          salesperson_name: string | null
          serial_number: string
          sold_at: string
          sold_price: number
          store_id: string
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          original_purchase_price?: number | null
          payment_method?: string | null
          product_id: string
          product_unit_id: string
          sale_id: string
          sale_item_id: string
          sale_number?: string | null
          salesperson_name?: string | null
          serial_number: string
          sold_at?: string
          sold_price: number
          store_id: string
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          original_purchase_price?: number | null
          payment_method?: string | null
          product_id?: string
          product_unit_id?: string
          sale_id?: string
          sale_item_id?: string
          sale_number?: string | null
          salesperson_name?: string | null
          serial_number?: string
          sold_at?: string
          sold_price?: number
          store_id?: string
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sold_product_units_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          phone: string | null
          postal_code: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_transaction_items: {
        Row: {
          created_at: string
          creates_new_product: boolean | null
          id: string
          product_id: string
          product_unit_ids: Json | null
          quantity: number
          total_cost: number
          transaction_id: string
          unit_cost: number
          unit_details: Json | null
        }
        Insert: {
          created_at?: string
          creates_new_product?: boolean | null
          id?: string
          product_id: string
          product_unit_ids?: Json | null
          quantity?: number
          total_cost: number
          transaction_id: string
          unit_cost: number
          unit_details?: Json | null
        }
        Update: {
          created_at?: string
          creates_new_product?: boolean | null
          id?: string
          product_id?: string
          product_unit_ids?: Json | null
          quantity?: number
          total_cost?: number
          transaction_id?: string
          unit_cost?: number
          unit_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
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
      user_session_preferences: {
        Row: {
          last_selected_store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_selected_store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_selected_store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_session_preferences_last_selected_store_id_fkey"
            columns: ["last_selected_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stores: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_effective_stock: {
        Row: {
          effective_stock: number | null
          product_id: string | null
        }
        Insert: {
          effective_stock?: never
          product_id?: string | null
        }
        Update: {
          effective_stock?: never
          product_id?: string | null
        }
        Relationships: []
      }
      product_units_limited: {
        Row: {
          barcode: string | null
          battery_level: number | null
          color: string | null
          created_at: string | null
          id: string | null
          max_price: number | null
          min_price: number | null
          price: number | null
          product_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          ram: number | null
          serial_number: string | null
          status: string | null
          storage: number | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          battery_level?: number | null
          color?: string | null
          created_at?: string | null
          id?: string | null
          max_price?: never
          min_price?: never
          price?: never
          product_id?: string | null
          purchase_date?: never
          purchase_price?: never
          ram?: number | null
          serial_number?: string | null
          status?: string | null
          storage?: number | null
          supplier_id?: never
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          battery_level?: number | null
          color?: string | null
          created_at?: string | null
          id?: string | null
          max_price?: never
          min_price?: never
          price?: never
          product_id?: string | null
          purchase_date?: never
          purchase_price?: never
          ram?: number | null
          serial_number?: string | null
          status?: string | null
          storage?: number | null
          supplier_id?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_effective_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
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
      calculate_employee_bonuses: { Args: never; Returns: undefined }
      can_view_purchase_price: { Args: never; Returns: boolean }
      can_view_salary: {
        Args: { target_employee_id: string }
        Returns: boolean
      }
      check_account_lockout: { Args: { user_email: string }; Returns: Json }
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
      cleanup_invalid_auth_state: { Args: never; Returns: undefined }
      cleanup_old_security_logs: { Args: never; Returns: undefined }
      create_sale_transaction:
        | { Args: { p_sale_data: Json; p_sale_items: Json[] }; Returns: Json }
        | { Args: { sale_data: Json; sale_items_data: Json }; Returns: Json }
      debug_user_store_access: { Args: never; Returns: Json }
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
      fix_product_consistency_issues: {
        Args: never
        Returns: {
          details: string
          fixed_count: number
          fixed_type: string
        }[]
      }
      generate_and_register_barcode: {
        Args: {
          p_barcode_type: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      generate_repair_number: { Args: never; Returns: string }
      generate_return_number: { Args: never; Returns: string }
      generate_sale_number: { Args: never; Returns: string }
      generate_supplier_transaction_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_metrics: { Args: never; Returns: Json }
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
      get_product_effective_stock: {
        Args: { product_uuid: string }
        Returns: number
      }
      get_user_current_store_id: { Args: never; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_user_store_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_barcode_counter: {
        Args: { counter_type: string }
        Returns: number
      }
      is_ip_blocked: { Args: { client_ip: unknown }; Returns: boolean }
      log_purchase_price_access_attempt: { Args: never; Returns: undefined }
      sanitize_and_validate_input: {
        Args: { input_text: string; input_type: string; max_length?: number }
        Returns: Json
      }
      search_brands: {
        Args: { max_results?: number; search_term: string }
        Returns: {
          category_id: number
          id: string
          logo_url: string
          name: string
          score: number
          slug: string
        }[]
      }
      search_models: {
        Args: { brand_name?: string; max_results?: number; search_term: string }
        Returns: {
          brand_id: string
          brand_name: string
          category_id: number
          color_variants: string[]
          id: string
          name: string
          release_year: number
          score: number
          slug: string
          storage_variants: string[]
        }[]
      }
      set_user_current_store: {
        Args: { target_store_id: string }
        Returns: undefined
      }
      slugify: { Args: { input: string }; Returns: string }
      user_has_store_access: {
        Args: { target_store_id: string }
        Returns: boolean
      }
      validate_product_consistency: {
        Args: never
        Returns: {
          description: string
          issue_type: string
          product_id: string
          severity: string
        }[]
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
