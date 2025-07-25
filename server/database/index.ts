import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = path.join(__dirname, 'simulateon.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');

    // Check if schema file exists
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      // Create a minimal schema inline
      const minimalSchema = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          company TEXT,
          role TEXT,
          phone TEXT,
          location TEXT,
          avatar_url TEXT,
          subscription_plan TEXT DEFAULT 'free',
          subscription_status TEXT DEFAULT 'active',
          trial_ends_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS calculations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          name TEXT,
          notes TEXT,
          parameters TEXT NOT NULL,
          results TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS subscription_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          price_monthly DECIMAL(10,2) NOT NULL,
          price_yearly DECIMAL(10,2) NOT NULL,
          calculations_limit INTEGER NOT NULL,
          features TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT OR REPLACE INTO subscription_plans (name, display_name, price_monthly, price_yearly, calculations_limit, features) VALUES
        ('free', 'Free', 0.00, 0.00, 10, '["Basic calculations", "Email support"]'),
        ('professional', 'Professional', 29.99, 299.99, 500, '["All calculation types", "Priority support", "Export capabilities"]'),
        ('enterprise', 'Enterprise', 99.99, 999.99, -1, '["Unlimited calculations", "24/7 support", "API access"]');
      `;
      db.exec(minimalSchema);
    } else {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Continuing without database initialization...');
  }
}

// Database utility functions
export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  company?: string;
  role?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Calculation {
  id: number;
  user_id: number;
  type: string;
  name?: string;
  notes?: string;
  parameters: string;
  results: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  calculations_limit: number;
  features: string;
  is_active: boolean;
  created_at: string;
}

// User operations
export const userDb = {
  create: null as any,
  findByEmail: null as any,
  findById: null as any,
  update: null as any,
  updateSubscription: null as any
};

// Session operations
export const sessionDb = {
  create: db.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `),
  
  findByToken: db.prepare(`
    SELECT s.*, u.* FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
  `),
  
  deleteByToken: db.prepare(`
    DELETE FROM user_sessions WHERE token = ?
  `),
  
  deleteExpired: db.prepare(`
    DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP
  `)
};

// Calculation operations
export const calculationDb = {
  create: db.prepare(`
    INSERT INTO calculations (user_id, type, name, notes, parameters, results)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  findByUserId: db.prepare(`
    SELECT * FROM calculations 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `),
  
  findById: db.prepare(`
    SELECT * FROM calculations WHERE id = ? AND user_id = ?
  `),
  
  update: db.prepare(`
    UPDATE calculations 
    SET name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM calculations WHERE id = ? AND user_id = ?
  `),
  
  countByUserId: db.prepare(`
    SELECT COUNT(*) as count FROM calculations WHERE user_id = ?
  `),
  
  countByUserIdAndMonth: db.prepare(`
    SELECT COUNT(*) as count FROM calculations 
    WHERE user_id = ? AND created_at >= date('now', 'start of month')
  `)
};

// Usage tracking operations
export const usageDb = {
  track: db.prepare(`
    INSERT INTO usage_tracking (user_id, calculation_type)
    VALUES (?, ?)
  `),
  
  getMonthlyUsage: db.prepare(`
    SELECT COUNT(*) as count FROM usage_tracking 
    WHERE user_id = ? AND created_at >= date('now', 'start of month')
  `),
  
  getUsageByType: db.prepare(`
    SELECT calculation_type, COUNT(*) as count 
    FROM usage_tracking 
    WHERE user_id = ? 
    GROUP BY calculation_type
  `)
};

// Subscription plan operations
export const planDb = {
  getAll: db.prepare(`
    SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_monthly ASC
  `),
  
  findByName: db.prepare(`
    SELECT * FROM subscription_plans WHERE name = ?
  `)
};

// Initialize database lazily when first needed
let dbInitialized = false;

export function ensureDbInitialized() {
  if (!dbInitialized) {
    initializeDatabase();
    dbInitialized = true;
  }
}
