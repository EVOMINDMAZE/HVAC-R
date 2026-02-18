import { RequestHandler } from "express";
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

export const signUp: RequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName, company, role, phone }: SignUpRequest = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Email, password, first name, and last name are required' 
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    // Use signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company,
          role,
          phone,
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

    return res.status(201).json({
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
    const message = error instanceof Error ? error.message : 'Failed to create account';
    console.error('Sign up error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: message
    });
  }
};

export const signIn: RequestHandler = async (req, res) => {
  try {
    const { email, password }: SignInRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials', 
        details: 'Email and password are required' 
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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

    return res.json({
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
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    console.error('Sign in error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: message
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

    return res.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    console.error('Sign out error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: message
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

    return res.json({
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
    const message = error instanceof Error ? error.message : 'Failed to get user information';
    console.error('Get current user error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: message
    });
  }
};

// Re-export the Supabase authentication middleware as the default authentication method
export const authenticateToken = authenticateSupabaseToken;
