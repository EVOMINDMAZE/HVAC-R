export interface Database {
  public: {
    Tables: {
      calculations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          calculation_type: string;
          inputs: any;
          results: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          calculation_type: string;
          inputs: any;
          results: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          calculation_type?: string;
          inputs?: any;
          results?: any;
        };
      };
      jobs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          client_name: string;
          job_name: string;
          status:
            | "pending"
            | "assigned"
            | "en_route"
            | "on_site"
            | "completed"
            | "cancelled";
          address: string | null;
          notes: string | null;
          photos: string[] | null;
          company_id: string;
          client_id: string | null;
          asset_id: string | null;
          technician_id: string | null;
          ticket_number: string | null;
          title: string | null;
          description: string | null;
          geo_lat: number | null;
          geo_lng: number | null;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string;
          client_name: string;
          job_name: string;
          status?:
            | "pending"
            | "assigned"
            | "en_route"
            | "on_site"
            | "completed"
            | "cancelled";
          address?: string | null;
          notes?: string | null;
          photos?: string[] | null;
          company_id: string;
          client_id?: string | null;
          asset_id?: string | null;
          technician_id?: string | null;
          ticket_number?: string | null;
          title?: string | null;
          description?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          client_name?: string;
          job_name?: string;
          status?:
            | "pending"
            | "assigned"
            | "en_route"
            | "on_site"
            | "completed"
            | "cancelled";
          address?: string | null;
          notes?: string | null;
          photos?: string[] | null;
          company_id?: string;
          client_id?: string | null;
          asset_id?: string | null;
          technician_id?: string | null;
          ticket_number?: string | null;
          title?: string | null;
          description?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: "active" | "past_due" | "canceled" | "inactive";
          price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: "active" | "past_due" | "canceled" | "inactive";
          price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: "active" | "past_due" | "canceled" | "inactive";
          price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          logo_url: string | null;
          primary_color: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          key: string;
          user_id: string;
          status: "active" | "past_due" | "canceled" | "inactive";
          plan_tier: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key?: string;
          user_id: string;
          status?: "active" | "past_due" | "canceled" | "inactive";
          plan_tier?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          user_id?: string;
          status?: "active" | "past_due" | "canceled" | "inactive";
          plan_tier?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workflow_requests: {
        Row: {
          id: string;
          user_id: string;
          workflow_type: string;
          status: "pending" | "processing" | "completed" | "failed";
          input_payload: any;
          result_payload: any;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workflow_type: string;
          status?: "pending" | "processing" | "completed" | "failed";
          input_payload?: any;
          result_payload?: any;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workflow_type?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          input_payload?: any;
          result_payload?: any;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      refrigerant_cylinders: {
        Row: {
          id: string;
          user_id: string;
          cylinder_code: string;
          refrigerant_type: string;
          initial_weight_lbs: number;
          current_weight_lbs: number;
          status: "active" | "empty" | "returned";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cylinder_code: string;
          refrigerant_type: string;
          initial_weight_lbs: number;
          current_weight_lbs: number;
          status?: "active" | "empty" | "returned";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cylinder_code?: string;
          refrigerant_type?: string;
          initial_weight_lbs?: number;
          current_weight_lbs?: number;
          status?: "active" | "empty" | "returned";
          created_at?: string;
          updated_at?: string;
        };
      };
      refrigerant_logs: {
        Row: {
          id: string;
          user_id: string;
          cylinder_id: string | null;
          job_id: string | null;
          transaction_type: "charge" | "recover" | "disposal" | "addition";
          amount_lbs: number;
          notes: string | null;
          technician_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cylinder_id?: string | null;
          job_id?: string | null;
          transaction_type: "charge" | "recover" | "disposal" | "addition";
          amount_lbs: number;
          notes?: string | null;
          technician_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cylinder_id?: string | null;
          job_id?: string | null;
          transaction_type?: "charge" | "recover" | "disposal" | "addition";
          amount_lbs?: number;
          notes?: string | null;
          technician_name?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          type: string;
          serial_number: string | null;
          location_on_site: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          type: string;
          serial_number?: string | null;
          location_on_site?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          type?: string;
          serial_number?: string | null;
          location_on_site?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role: "admin" | "client" | "tech";
          company_id: string | null;
          client_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: "admin" | "client" | "tech";
          company_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: "admin" | "client" | "tech";
          company_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_timeline: {
        Row: {
          id: string;
          job_id: string;
          user_id: string | null;
          status:
            | "pending"
            | "assigned"
            | "en_route"
            | "on_site"
            | "completed"
            | "cancelled";
          note: string | null;
          geo_lat: number | null;
          geo_lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id?: string | null;
          status:
            | "pending"
            | "assigned"
            | "en_route"
            | "on_site"
            | "completed"
            | "cancelled";
          note?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          user_id?: string | null;
          status?:
            | "pending"
            | "assigned"
            | "en_route"
            | "on_site"
            | "completed"
            | "cancelled";
          note?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          created_at?: string;
        };
      };
      automation_rules: {
        Row: {
          id: string;
          asset_id: string;
          company_id: string;
          trigger_type: string;
          threshold_value: number | null;
          action_type: string;
          action_config: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          company_id: string;
          trigger_type: string;
          threshold_value?: number | null;
          action_type?: string;
          action_config?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          company_id?: string;
          trigger_type?: string;
          threshold_value?: number | null;
          action_type?: string;
          action_config?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      telemetry_readings: {
        Row: {
          id: string;
          asset_id: string;
          reading_type: string;
          value: number;
          unit: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          reading_type: string;
          value: number;
          unit?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          reading_type?: string;
          value?: number;
          unit?: string | null;
          timestamp?: string;
        };
      };
    };
  };
}
