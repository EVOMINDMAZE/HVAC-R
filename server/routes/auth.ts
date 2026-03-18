import { RequestHandler } from "express";

import {
  asRecord,
  isValidEmail,
  toSafeErrorMessage,
} from "../utils/requestValidation.js";
import { getSupabaseClient } from "../utils/supabase.js";
import { authenticateSupabaseToken } from "../utils/supabaseAuth.js";

interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  role?: string;
  phone?: string;
}

interface SignInRequest {
  email: string;
  password: string;
}

function parseSignUpRequest(value: unknown): SignUpRequest | null {
  const body = asRecord(value);
  if (!body) return null;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  if (!email || !password || !firstName || !lastName) {
    return null;
  }
  return {
    email,
    password,
    firstName,
    lastName,
    company: typeof body.company === "string" ? body.company.trim() : undefined,
    role: typeof body.role === "string" ? body.role.trim() : undefined,
    phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
  };
}

function parseSignInRequest(value: unknown): SignInRequest | null {
  const body = asRecord(value);
  if (!body) return null;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return null;
  return { email, password };
}

export const signUp: RequestHandler = async (req, res) => {
  try {
    const payload = parseSignUpRequest(req.body);

    if (!payload) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Email, password, first name, and last name are required' 
      });
    }
    if (!isValidEmail(payload.email)) {
      return res.status(400).json({
        error: "Invalid email",
        details: "Please enter a valid email address",
      });
    }
    if (payload.password.length < 8) {
      return res.status(400).json({
        error: "Weak password",
        details: "Password must be at least 8 characters long",
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    // Use signUp
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          company: payload.company,
          role: payload.role,
          phone: payload.phone,
        },
      },
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Sign up failed', 
        details: error.message 
      });
    }

    if (!data.user) {
      return res.status(500).json({ error: "User creation failed" });
    }

    // If session is null, email confirmation might be required
    // For backward compatibility, we might want to ensure a session, but if Supabase requires email, we can't force it easily without admin
    // However, if we use admin.createUser with email_confirm: true, we can then sign in.
    // Let's stick to standard signUp flow. If session is missing, client handles it.

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          ...data.user.user_metadata
        },
        token: data.session?.access_token || null,
        expiresAt: data.session?.expires_at || null
      }
    });

  } catch (error: unknown) {
    console.error('Sign up error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: toSafeErrorMessage(error, "Failed to create account"),
    });
  }
};

export const signIn: RequestHandler = async (req, res) => {
  try {
    const payload = parseSignInRequest(req.body);

    if (!payload) {
      return res.status(400).json({ 
        error: 'Missing credentials', 
        details: 'Email and password are required' 
      });
    }
    if (!isValidEmail(payload.email)) {
      return res.status(400).json({
        error: "Invalid credentials",
        details: "Email format is invalid",
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        details: error.message 
      });
    }

    if (!data.session) {
      return res.status(500).json({ error: "Failed to create session" });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          ...data.user.user_metadata
        },
        token: data.session.access_token,
        expiresAt: data.session.expires_at
      }
    });

  } catch (error: unknown) {
    console.error('Sign in error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: toSafeErrorMessage(error, "Failed to sign in"),
    });
  }
};

export const signOut: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const supabase = getSupabaseClient(token);
      if (supabase) {
        await supabase.auth.signOut();
      }
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error: unknown) {
    console.error('Sign out error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: toSafeErrorMessage(error, "Failed to sign out"),
    });
  }
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }

    const supabase = getSupabaseClient(token);
    if (!supabase) {
        return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired session',
        details: error?.message
      });
    }

    res.json({
      success: true,
      data: {
        user: {
            id: user.id,
            email: user.email,
            ...user.user_metadata
        }
      }
    });

  } catch (error: unknown) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: toSafeErrorMessage(error, "Failed to get user information"),
    });
  }
};

// Re-export the Supabase authentication middleware as the default authentication method
export const authenticateToken = authenticateSupabaseToken;
