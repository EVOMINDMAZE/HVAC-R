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
                    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
                    address: string | null;
                    notes: string | null;
                    photos: string[] | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    user_id?: string;
                    client_name: string;
                    job_name: string;
                    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
                    address?: string | null;
                    notes?: string | null;
                    photos?: string[] | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    user_id?: string;
                    client_name?: string;
                    job_name?: string;
                    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
                    address?: string | null;
                    notes?: string | null;
                    photos?: string[] | null;
                };
            };
            subscriptions: {
                Row: {
                    id: string;
                    user_id: string;
                    stripe_customer_id: string | null;
                    stripe_subscription_id: string | null;
                    status: 'active' | 'past_due' | 'canceled' | 'inactive';
                    price_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    status?: 'active' | 'past_due' | 'canceled' | 'inactive';
                    price_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    status?: 'active' | 'past_due' | 'canceled' | 'inactive';
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
                    status: 'active' | 'past_due' | 'canceled' | 'inactive';
                    plan_tier: string | null;
                    expires_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    key?: string;
                    user_id: string;
                    status?: 'active' | 'past_due' | 'canceled' | 'inactive';
                    plan_tier?: string | null;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    key?: string;
                    user_id?: string;
                    status?: 'active' | 'past_due' | 'canceled' | 'inactive';
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
                    status: 'pending' | 'processing' | 'completed' | 'failed';
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
                    status?: 'pending' | 'processing' | 'completed' | 'failed';
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
                    status?: 'pending' | 'processing' | 'completed' | 'failed';
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
                    status: 'active' | 'empty' | 'returned';
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
                    status?: 'active' | 'empty' | 'returned';
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
                    status?: 'active' | 'empty' | 'returned';
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
                    transaction_type: 'charge' | 'recover' | 'disposal' | 'addition';
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
                    transaction_type: 'charge' | 'recover' | 'disposal' | 'addition';
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
                    transaction_type?: 'charge' | 'recover' | 'disposal' | 'addition';
                    amount_lbs?: number;
                    notes?: string | null;
                    technician_name?: string | null;
                    created_at?: string;
                };
            };
        };
    };
}
