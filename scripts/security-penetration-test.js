#!/usr/bin/env node

/**
 * Security Penetration Testing Script for Privacy Endpoints
 * Tests various attack vectors against new privacy compliance APIs
 */

import { config } from 'dotenv';

config();

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-id'; // Will be replaced with actual test user
const TEST_TOKEN = 'test-token'; // Will be replaced with actual JWT

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

class SecurityTester {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async test(name, testFn) {
    this.testCount++;
    this.log(`\n[${this.testCount}] ${name}`, 'blue');
    
    try {
      const result = await testFn();
      if (result.passed) {
        this.passCount++;
        this.log(`✓ PASS: ${result.message}`, 'green');
      } else {
        this.failCount++;
        this.log(`✗ FAIL: ${result.message}`, 'red');
        if (result.details) {
          this.log(`  Details: ${result.details}`, 'yellow');
        }
      }
      this.results.push({ name, ...result });
    } catch (error) {
      this.failCount++;
      this.log(`✗ ERROR: ${error.message}`, 'red');
      this.results.push({ name, passed: false, message: `Test error: ${error.message}` });
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY PENETRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.testCount}`);
    console.log(`Passed: ${this.passCount}`);
    console.log(`Failed: ${this.failCount}`);
    
    console.log('\nDETAILED RESULTS:');
    this.results.forEach((result, idx) => {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      const color = result.passed ? 'green' : 'red';
      this.log(`  ${idx + 1}. ${status}: ${result.name}`, color);
    });
    
    console.log('\nRECOMMENDATIONS:');
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });
  }

  generateRecommendations() {
    const recs = [];
    
    // Check for JWT verification issues
    const jwtTest = this.results.find(r => r.name.includes('JWT'));
    if (jwtTest && !jwtTest.passed) {
      recs.push('Implement proper JWT signature verification using Supabase JWT secret');
    }
    
    // Check for SQL injection vulnerabilities
    const sqlTest = this.results.find(r => r.name.includes('SQL'));
    if (sqlTest && !sqlTest.passed) {
      recs.push('Use parameterized queries or RPC functions with proper input validation');
    }
    
    // Check for authorization issues
    const authTest = this.results.find(r => r.name.includes('Authorization'));
    if (authTest && !authTest.passed) {
      recs.push('Implement proper user ID validation in all database queries');
    }
    
    // Check for rate limiting
    const rateTest = this.results.find(r => r.name.includes('Rate'));
    if (rateTest && !rateTest.passed) {
      recs.push('Implement rate limiting on privacy endpoints (especially DSR requests)');
    }
    
    // Check for input validation
    const inputTest = this.results.find(r => r.name.includes('Input'));
    if (inputTest && !inputTest.passed) {
      recs.push('Implement comprehensive input validation and sanitization');
    }
    
    if (recs.length === 0) {
      recs.push('All security checks passed. Continue monitoring and regular security audits.');
    }
    
    return recs;
  }

  // Test 1: JWT Token Verification
  async testJwtVerification() {
    // Test with invalid token (malformed)
    const response = await fetch(`${API_BASE}/api/privacy/consent`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid.token.here'
      }
    });
    
    // Should reject invalid token with 401
    if (response.status === 401) {
      return { passed: true, message: 'API rejects invalid JWT tokens' };
    } else {
      return { 
        passed: false, 
        message: 'API accepts invalid JWT tokens',
        details: `Expected 401, got ${response.status}. This indicates missing JWT signature verification.`
      };
    }
  }

  // Test 2: SQL Injection Attempts
  async testSqlInjection() {
    const maliciousPayload = {
      consent_type: "privacy' OR '1'='1",
      consent_version: "1.0' --",
      granted: true
    };
    
    const response = await fetch(`${API_BASE}/api/privacy/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test.token'
      },
      body: JSON.stringify(maliciousPayload)
    });
    
    // Should reject with 400/401, not 500 (SQL error)
    if (response.status === 401 || response.status === 400) {
      return { passed: true, message: 'SQL injection attempts properly rejected' };
    } else if (response.status === 500) {
      return { 
        passed: false, 
        message: 'Potential SQL injection vulnerability',
        details: 'Server returned 500 on SQL injection attempt, suggesting database error'
      };
    } else {
      return { 
        passed: false, 
        message: 'Unexpected response to SQL injection attempt',
        details: `Status: ${response.status}`
      };
    }
  }

  // Test 3: Authorization Bypass Attempt
  async testAuthorizationBypass() {
    // This test requires a valid token for user A
    // Attempt to access user B's data by modifying user ID in request
    // Since we can't generate valid tokens easily, we'll test the pattern
    
    const response = await fetch(`${API_BASE}/api/privacy/consent`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWItaWQiLCJlbWFpbCI6InVzZXJiQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' // Fake token with different user ID
      }
    });
    
    // Check if server validates token user ID matches request user ID
    if (response.status === 401 || response.status === 403) {
      return { passed: true, message: 'Authorization properly validated' };
    } else {
      return { 
        passed: false, 
        message: 'Potential authorization bypass',
        details: 'Server may not be validating user ownership of requested data'
      };
    }
  }

  // Test 4: Rate Limiting Check
  async testRateLimiting() {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        fetch(`${API_BASE}/api/privacy/dsr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test.token'
          },
          body: JSON.stringify({
            request_type: 'access',
            description: 'Test rate limiting'
          })
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      return { passed: true, message: 'Rate limiting is implemented' };
    } else {
      return { 
        passed: false, 
        message: 'Rate limiting not detected',
        details: '10 rapid requests did not trigger rate limiting (429 status)'
      };
    }
  }

  // Test 5: Input Validation
  async testInputValidation() {
    const invalidPayloads = [
      { consent_type: '', consent_version: '', granted: 'not-a-boolean' },
      { consent_type: 'a'.repeat(1000), consent_version: 'b'.repeat(1000), granted: true },
      { consent_type: '<script>alert("xss")</script>', consent_version: '1.0', granted: true },
      { request_type: 'invalid_type', description: 'test' }
    ];
    
    let passedCount = 0;
    let failedPayloads = [];
    
    for (const payload of invalidPayloads) {
      const endpoint = payload.request_type ? '/api/privacy/dsr' : '/api/privacy/consent';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test.token'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 400 || response.status === 422) {
        passedCount++;
      } else {
        failedPayloads.push({ payload, status: response.status });
      }
    }
    
    if (passedCount === invalidPayloads.length) {
      return { passed: true, message: 'Input validation is working properly' };
    } else {
      return { 
        passed: false, 
        message: 'Input validation issues detected',
        details: `${failedPayloads.length} invalid payloads were accepted`
      };
    }
  }

  // Test 6: Information Leakage
  async testInformationLeakage() {
    // Test error responses for sensitive information
    const response = await fetch(`${API_BASE}/api/privacy/export`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid'
      }
    });
    
    const body = await response.text();
    
    // Check for sensitive info in error responses
    const sensitivePatterns = [
      /sql/i,
      /database/i,
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /jwt/i
    ];
    
    const leaks = sensitivePatterns.filter(pattern => pattern.test(body));
    
    if (leaks.length > 0) {
      return { 
        passed: false, 
        message: 'Potential information leakage in error responses',
        details: `Found sensitive patterns: ${leaks.map(p => p.source).join(', ')}`
      };
    } else {
      return { passed: true, message: 'No sensitive information leakage detected' };
    }
  }

  // Test 7: CORS Configuration
  async testCorsConfiguration() {
    const response = await fetch(`${API_BASE}/api/privacy/consent`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://malicious-site.com'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader === '*' || corsHeader === 'http://malicious-site.com') {
      return { 
        passed: false, 
        message: 'Overly permissive CORS configuration',
        details: `CORS allows origin: ${corsHeader}`
      };
    } else {
      return { passed: true, message: 'CORS properly restricted' };
    }
  }
}

async function main() {
  console.log('Starting Security Penetration Tests for Privacy Endpoints\n');
  
  const tester = new SecurityTester();
  
  // Run security tests
  await tester.test('JWT Token Verification', () => tester.testJwtVerification());
  await tester.test('SQL Injection Protection', () => tester.testSqlInjection());
  await tester.test('Authorization Bypass Protection', () => tester.testAuthorizationBypass());
  await tester.test('Rate Limiting Implementation', () => tester.testRateLimiting());
  await tester.test('Input Validation', () => tester.testInputValidation());
  await tester.test('Information Leakage Prevention', () => tester.testInformationLeakage());
  await tester.test('CORS Configuration Security', () => tester.testCorsConfiguration());
  
  tester.printSummary();
  
  // Exit with appropriate code
  process.exit(tester.failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});