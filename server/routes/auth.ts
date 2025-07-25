import { RequestHandler } from "express";
import { userDb, sessionDb, User } from "../database/index.js";
import { AuthUtils } from "../utils/auth.js";

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

    // Validate email format
    if (!AuthUtils.validateEmail(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate password strength
    const passwordValidation = AuthUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password validation failed', 
        details: passwordValidation.message 
      });
    }

    // Check if user already exists
    const existingUser = userDb.findByEmail.get(email.toLowerCase()) as User | undefined;
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists', 
        details: 'An account with this email address already exists' 
      });
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    // Create user
    const result = userDb.create.run(
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      company || null,
      role || null,
      phone || null
    );

    // Get created user
    const user = userDb.findById.get(result.lastInsertRowid) as User;

    // Create session
    const sessionToken = AuthUtils.generateSessionToken();
    const expiresAt = AuthUtils.getExpiryDate(30); // 30 days

    sessionDb.create.run(user.id, sessionToken, expiresAt);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token: sessionToken,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: 'Failed to create account' 
    });
  }
};

export const signIn: RequestHandler = async (req, res) => {
  try {
    const { email, password }: SignInRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials', 
        details: 'Email and password are required' 
      });
    }

    // Find user
    const user = userDb.findByEmail.get(email.toLowerCase()) as User | undefined;
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        details: 'Email or password is incorrect' 
      });
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        details: 'Email or password is incorrect' 
      });
    }

    // Create session
    const sessionToken = AuthUtils.generateSessionToken();
    const expiresAt = AuthUtils.getExpiryDate(30); // 30 days

    sessionDb.create.run(user.id, sessionToken, expiresAt);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.json({
      success: true,
      data: {
        user: userResponse,
        token: sessionToken,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: 'Failed to sign in' 
    });
  }
};

export const signOut: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      sessionDb.deleteByToken.run(token);
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: 'Failed to sign out' 
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

    const session = sessionDb.findByToken.get(token);
    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid or expired session' 
      });
    }

    // Remove password hash from response
    const { password_hash, ...userResponse } = session;

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: 'Failed to get user information' 
    });
  }
};

// Middleware to authenticate requests
export const authenticateToken: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const session = sessionDb.findByToken.get(token);
    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid or expired session' 
      });
    }

    // Add user to request object
    (req as any).user = session;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed' 
    });
  }
};
