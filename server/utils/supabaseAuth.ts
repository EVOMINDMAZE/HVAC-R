import { RequestHandler } from "express";
import jwt from 'jsonwebtoken';

// Supabase JWT verification middleware
export const authenticateSupabaseToken: RequestHandler = async (req, res, next) => {
  try {
    console.log('Auth middleware called for:', req.path);
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Decode the Supabase JWT token without verification for now
    // In production, you should verify the JWT signature using Supabase JWT secret
    const decoded = jwt.decode(token) as any;
    console.log('Decoded token:', decoded ? 'valid' : 'invalid');

    if (!decoded || !decoded.sub) {
      console.log('Invalid token structure');
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    // Create a user object from the Supabase token
    const user = {
      id: decoded.sub,
      email: decoded.email,
      stripe_customer_id: decoded.user_metadata?.stripe_customer_id || null,
      stripe_subscription_id: decoded.user_metadata?.stripe_subscription_id || null,
      subscription_plan: decoded.user_metadata?.subscription_plan || 'free',
      subscription_status: decoded.user_metadata?.subscription_status || 'active'
    };

    // Add user to request object
    (req as any).user = user;
    next();

  } catch (error) {
    console.error('Supabase authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed' 
    });
  }
};
