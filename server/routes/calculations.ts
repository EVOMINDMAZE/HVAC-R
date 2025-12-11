import { RequestHandler } from "express";
import { supabaseAdmin, getSupabaseClient } from "../utils/supabase.js";

interface SaveCalculationRequest {
  type: 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle' | 'A2L Safety';
  name?: string;
  notes?: string;
  parameters: any;
  results: any;
}

export const saveCalculation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { type, name, notes, parameters, results }: SaveCalculationRequest = req.body;
    const token = req.headers.authorization;

    // Validate input
    if (!type || !parameters || !results) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Type, parameters, and results are required'
      });
    }

    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration missing" });
    }

    // 1. Get user's plan details
    const planName = user.subscription_plan || 'free';

    // Default fallback limits
    let plan = {
      calculations_limit: planName === 'free' ? 5 : (planName === 'solo' ? 50 : -1),
      limit_period: planName === 'free' ? 'weekly' : 'monthly',
      display_name: planName.charAt(0).toUpperCase() + planName.slice(1)
    };

    // Try to get from DB via Supabase (public read)
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single();

    if (planData) {
      plan = planData;
    }

    // 2. Check limits
    if (plan.calculations_limit > -1) {
      const now = new Date();
      let startDate = new Date();

      if (plan.limit_period === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else {
        // Monthly - Start of current month
        startDate.setDate(1);
      }

      // Use supabase client (with user token) to count
      const { count, error: countError } = await supabase
        .from('calculations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id) // Redundant with RLS but good for clarity
        .gte('created_at', startDate.toISOString());

      if (countError) {
        console.error('Usage check failed:', countError);
      } else if (count !== null && count >= plan.calculations_limit) {
        return res.status(403).json({
          error: 'Calculation limit reached',
          details: `Your ${plan.display_name} plan allows ${plan.calculations_limit} calculations per ${plan.limit_period}. Usage: ${count}/${plan.calculations_limit}. Upgrade to continue.`,
          upgradeRequired: true
        });
      }
    }

    // 3. Save calculation
    const { data: savedCalc, error: saveError } = await supabase
      .from('calculations')
      .insert({
        user_id: user.id,
        type,
        name: name || null,
        notes: notes || null,
        parameters: parameters, // Supabase handles JSONB automatically if type is json
        results: results
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save calculation error:', saveError);
      throw new Error("Database insert failed: " + saveError.message);
    }

    res.status(201).json({
      success: true,
      data: savedCalc
    });

  } catch (error: any) {
    console.error('Save calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Failed to save calculation'
    });
  }
};

export const getCalculations: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const token = req.headers.authorization;

    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration missing" });
    }

    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to retrieve calculations'
    });
  }
};

export const getCalculation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const token = req.headers.authorization;

    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration missing" });
    }

    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Calculation not found'
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Get calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to retrieve calculation'
    });
  }
};

export const updateCalculation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, notes } = req.body;
    const token = req.headers.authorization;

    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration missing" });
    }

    const { data, error } = await supabase
      .from('calculations')
      .update({ name, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Calculation not found or update failed'
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Update calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to update calculation'
    });
  }
};

export const deleteCalculation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const token = req.headers.authorization;

    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration missing" });
    }

    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Delete failed' });
    }

    res.json({
      success: true,
      message: 'Calculation deleted successfully'
    });

  } catch (error) {
    console.error('Delete calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to delete calculation'
    });
  }
};

export const getUserStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const token = req.headers.authorization;

    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: "Database configuration missing" });
    }

    // Get plan details
    const planName = user.subscription_plan || 'free';

    // Default fallback limits
    let plan = {
      calculations_limit: planName === 'free' ? 5 : (planName === 'solo' ? 50 : -1),
      limit_period: planName === 'free' ? 'weekly' : 'monthly'
    };

    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single();

    if (planData) {
      plan = planData;
    }

    // Calculate start date for usage
    const now = new Date();
    let startDate = new Date();
    if (plan.limit_period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(1);
    }

    // Parallel fetch
    const [totalRes, periodRes, typeRes] = await Promise.all([
      supabase.from('calculations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('calculations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startDate.toISOString()),
      supabase.from('calculations').select('type').eq('user_id', user.id)
    ]);

    const totalCalculations = totalRes.count || 0;
    const periodUsage = periodRes.count || 0;

    // Aggregate by type
    const usageByTypeMap: Record<string, number> = {};
    (typeRes.data || []).forEach((c: any) => {
      usageByTypeMap[c.type] = (usageByTypeMap[c.type] || 0) + 1;
    });
    const usageByType = Object.entries(usageByTypeMap).map(([type, count]) => ({ calculation_type: type, count }));

    res.json({
      success: true,
      data: {
        totalCalculations,
        monthlyCalculations: periodUsage,
        usageByType,
        subscription: {
          plan: user.subscription_plan,
          limit: plan.calculations_limit,
          remaining: plan.calculations_limit > 0
            ? Math.max(0, plan.calculations_limit - periodUsage)
            : -1 // Unlimited
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to retrieve user statistics'
    });
  }
};
