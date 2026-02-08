#!/usr/bin/env node
/**
 * Test Supabase connection and authentication configuration
 * 
 * This script validates that Supabase environment variables are configured
 * and that both admin and anonymous clients can connect to the database.
 * 
 * Usage: node scripts/test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Connection Test');
console.log('===========================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl) {
  console.error('\n❌ VITE_SUPABASE_URL is required. Please set it in your .env file.');
  process.exit(1);
}

// Validate URL format
let isValidUrl = false;
try {
  new URL(supabaseUrl);
  isValidUrl = true;
} catch (e) {
  console.error(`❌ Invalid Supabase URL: ${supabaseUrl}`);
}

if (!isValidUrl) {
  process.exit(1);
}

// Test 1: Anonymous client connection
console.log('\n🔐 Test 1: Anonymous Client Connection');
if (anonKey) {
  try {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    // Try to fetch a public table (companies) to test connection
    const { data, error } = await anonClient
      .from('companies')
      .select('id, company_name')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      console.log(`   ℹ️  Error details: ${error.code} - ${error.details}`);
    } else {
      console.log(`   ✅ Connection successful`);
      console.log(`   📊 Retrieved ${data?.length || 0} companies`);
      if (data && data.length > 0) {
        console.log(`   👤 Sample company: ${data[0].company_name} (ID: ${data[0].id})`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
  }
} else {
  console.log('   ⚠️  Skipping - VITE_SUPABASE_ANON_KEY not set');
}

// Test 2: Admin client connection
console.log('\n🔐 Test 2: Admin Client Connection');
if (serviceRoleKey) {
  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Try to fetch from a protected table (users via auth schema is not accessible)
    // Instead, try to call a simple RPC function that doesn't modify data
    const { data, error } = await adminClient
      .rpc('get_server_version');
    
    if (error) {
      // If the RPC doesn't exist, try a simple query to auth.users (admin only)
      const { data: users, error: usersError } = await adminClient
        .from('auth.users')
        .select('id, email')
        .limit(1);
      
      if (usersError) {
        console.log(`   ❌ Admin connection failed: ${usersError.message}`);
        console.log(`   ℹ️  Error details: ${usersError.code} - ${usersError.details}`);
      } else {
        console.log(`   ✅ Admin connection successful`);
        console.log(`   📊 Retrieved ${users?.length || 0} users`);
        if (users && users.length > 0) {
          console.log(`   👤 Sample user: ${users[0].email} (ID: ${users[0].id})`);
        }
      }
    } else {
      console.log(`   ✅ Admin connection successful (RPC responded)`);
      console.log(`   📊 Server version: ${data}`);
    }
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
  }
} else {
  console.log('   ⚠️  Skipping - SUPABASE_SERVICE_ROLE_KEY not set');
}

// Test 3: Authentication bypass check (production safety)
console.log('\n🔐 Test 3: Production Security Check');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`   NODE_ENV: ${nodeEnv}`);

if (nodeEnv === 'production') {
  console.log('   ✅ Running in production mode');
  
  // Check for development bypass flags
  const hasBypassParam = process.argv.some(arg => arg.includes('bypassAuth=1'));
  const hasDebugBypass = process.env.DEBUG_BYPASS === '1';
  
  if (hasBypassParam) {
    console.log('   ⚠️  WARNING: bypassAuth=1 parameter detected in production!');
  }
  if (hasDebugBypass) {
    console.log('   ⚠️  WARNING: DEBUG_BYPASS=1 environment variable detected in production!');
  }
  
  if (!hasBypassParam && !hasDebugBypass) {
    console.log('   ✅ No authentication bypass flags detected');
  }
} else {
  console.log('   ℹ️  Running in development mode - bypass checks skipped');
}

console.log('\n📊 Summary:');
console.log('===========');
console.log('If all connection tests passed ✅, your Supabase configuration is working correctly.');
console.log('If any tests failed ❌, please check:');
console.log('1. Environment variables in .env file');
console.log('2. Supabase project is running and accessible');
console.log('3. Network connectivity and firewall settings');
console.log('4. Database permissions and RLS policies');
console.log('\n🔗 Supabase Dashboard:', supabaseUrl.replace(/\.supabase\.co.*/, '.supabase.co'));