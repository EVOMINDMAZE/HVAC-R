import { RequestHandler } from "express";
import { calculationDb, usageDb, planDb } from "../database/index.ts";

interface SaveCalculationRequest {
  type: 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle';
  name?: string;
  notes?: string;
  parameters: any;
  results: any;
}

export const saveCalculation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { type, name, notes, parameters, results }: SaveCalculationRequest = req.body;

    // Validate input
    if (!type || !parameters || !results) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Type, parameters, and results are required'
      });
    }

    // Check user's calculation limit
    const userPlan = planDb.findByName.get(user.subscription_plan);
    if (userPlan && userPlan.calculations_limit > 0) {
      const monthlyUsage = calculationDb.countByUserIdAndMonth.get(user.id);
      if (monthlyUsage.count >= userPlan.calculations_limit) {
        return res.status(403).json({
          error: 'Calculation limit reached',
          details: `Your ${userPlan.display_name} plan allows ${userPlan.calculations_limit} calculations per month. Upgrade to continue.`,
          upgradeRequired: true
        });
      }
    }

    // Save calculation
    const result = calculationDb.create.run(
      user.id,
      type,
      name || null,
      notes || null,
      JSON.stringify(parameters),
      JSON.stringify(results)
    );

    // Track usage
    usageDb.track.run(user.id, type);

    // Get saved calculation
    const savedCalculation = calculationDb.findById.get(result.lastInsertRowid, user.id);

    res.status(201).json({
      success: true,
      data: {
        ...savedCalculation,
        parameters: JSON.parse(savedCalculation.parameters),
        results: JSON.parse(savedCalculation.results)
      }
    });

  } catch (error) {
    console.error('Save calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to save calculation'
    });
  }
};

export const getCalculations: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const calculations = calculationDb.findByUserId.all(user.id);

    const parsedCalculations = calculations.map(calc => ({
      ...calc,
      parameters: JSON.parse(calc.parameters),
      results: JSON.parse(calc.results)
    }));

    res.json({
      success: true,
      data: parsedCalculations
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

    const calculation = calculationDb.findById.get(parseInt(id), user.id);
    if (!calculation) {
      return res.status(404).json({
        error: 'Calculation not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...calculation,
        parameters: JSON.parse(calculation.parameters),
        results: JSON.parse(calculation.results)
      }
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

    const result = calculationDb.update.run(name, notes, parseInt(id), user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Calculation not found'
      });
    }

    const updatedCalculation = calculationDb.findById.get(parseInt(id), user.id);

    res.json({
      success: true,
      data: {
        ...updatedCalculation,
        parameters: JSON.parse(updatedCalculation.parameters),
        results: JSON.parse(updatedCalculation.results)
      }
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

    const result = calculationDb.delete.run(parseInt(id), user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Calculation not found'
      });
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

    // Get calculation counts
    const totalCalculations = calculationDb.countByUserId.get(user.id);
    const monthlyCalculations = calculationDb.countByUserIdAndMonth.get(user.id);
    
    // Get usage by type
    const usageByType = usageDb.getUsageByType.all(user.id);
    
    // Get user's plan limits
    const userPlan = planDb.findByName.get(user.subscription_plan);

    res.json({
      success: true,
      data: {
        totalCalculations: totalCalculations.count,
        monthlyCalculations: monthlyCalculations.count,
        usageByType: usageByType,
        subscription: {
          plan: user.subscription_plan,
          limit: userPlan?.calculations_limit || 0,
          remaining: userPlan?.calculations_limit > 0 
            ? Math.max(0, userPlan.calculations_limit - monthlyCalculations.count)
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
