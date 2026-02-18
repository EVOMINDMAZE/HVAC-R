#!/usr/bin/env node

/**
 * Performance Testing Script for Privacy Endpoints
 * Measures response times, throughput, and error rates under load
 */

import { config } from 'dotenv';
import { performance } from 'perf_hooks';

config();

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 100;
const ENDPOINTS = [
  { method: 'GET', path: '/api/privacy/consent', requiresAuth: true },
  { method: 'POST', path: '/api/privacy/consent', requiresAuth: true },
  { method: 'POST', path: '/api/privacy/dsr', requiresAuth: true },
  { method: 'POST', path: '/api/privacy/export', requiresAuth: true },
  { method: 'GET', path: '/api/privacy/consent/check?consent_type=privacy', requiresAuth: true }
];

// Generate a test JWT token for performance testing (development only)
function generateTestToken() {
  // In development, we can use the bypass feature or a simple token
  // For performance testing, we'll use an invalid token (expects 401)
  // This still tests the authentication middleware performance
  return 'test.invalid.token';
}

class PerformanceTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      statusCodes: {},
      endpointStats: {}
    };
    this.startTime = 0;
    this.endTime = 0;
  }

  async makeRequest(endpoint, userIndex) {
    const url = `${API_BASE}${endpoint.path}`;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateTestToken()}`
      }
    };

    if (endpoint.method === 'POST') {
      options.body = JSON.stringify({
        consent_type: 'performance_test',
        consent_version: '1.0',
        granted: true,
        ...(endpoint.path.includes('/dsr') ? { request_type: 'access', description: 'Performance test' } : {})
      });
    }

    const start = performance.now();
    try {
      const response = await fetch(url, options);
      const end = performance.now();
      const responseTime = end - start;

      this.recordResult({
        endpoint: endpoint.path,
        method: endpoint.method,
        statusCode: response.status,
        responseTime,
        success: response.status < 500
      });

      return { success: true, status: response.status, responseTime };
    } catch (error) {
      const end = performance.now();
      const responseTime = end - start;
      
      this.recordResult({
        endpoint: endpoint.path,
        method: endpoint.method,
        statusCode: 0,
        responseTime,
        success: false,
        error: error.message
      });

      return { success: false, status: 0, responseTime, error: error.message };
    }
  }

  recordResult(result) {
    this.results.totalRequests++;
    
    if (result.success && result.statusCode < 400) {
      this.results.successfulRequests++;
    } else {
      this.results.failedRequests++;
    }

    this.results.totalResponseTime += result.responseTime;
    this.results.minResponseTime = Math.min(this.results.minResponseTime, result.responseTime);
    this.results.maxResponseTime = Math.max(this.results.maxResponseTime, result.responseTime);

    // Track status codes
    this.results.statusCodes[result.statusCode] = (this.results.statusCodes[result.statusCode] || 0) + 1;

    // Track endpoint stats
    const endpointKey = `${result.method} ${result.endpoint}`;
    if (!this.results.endpointStats[endpointKey]) {
      this.results.endpointStats[endpointKey] = {
        totalRequests: 0,
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        statusCodes: {}
      };
    }

    const stats = this.results.endpointStats[endpointKey];
    stats.totalRequests++;
    stats.totalResponseTime += result.responseTime;
    stats.minResponseTime = Math.min(stats.minResponseTime, result.responseTime);
    stats.maxResponseTime = Math.max(stats.maxResponseTime, result.responseTime);
    stats.statusCodes[result.statusCode] = (stats.statusCodes[result.statusCode] || 0) + 1;
  }

  async runConcurrentTest() {
    console.log('🚀 Starting Performance Test for Privacy Endpoints\n');
    console.log(`Configuration:`);
    console.log(`  API Base: ${API_BASE}`);
    console.log(`  Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`  Requests per User: ${REQUESTS_PER_USER}`);
    console.log(`  Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
    console.log('');

    this.startTime = performance.now();

    const userPromises = [];
    for (let userIndex = 0; userIndex < CONCURRENT_USERS; userIndex++) {
      userPromises.push(this.runUserTest(userIndex));
    }

    await Promise.all(userPromises);
    
    this.endTime = performance.now();
  }

  async runUserTest(userIndex) {
    const requests = [];
    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      requests.push(this.makeRequest(endpoint, userIndex));
      
      // Small delay between requests to simulate real user behavior
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return Promise.all(requests);
  }

  printResults() {
    const totalTime = (this.endTime - this.startTime) / 1000; // seconds
    const requestsPerSecond = this.results.totalRequests / totalTime;
    const avgResponseTime = this.results.totalResponseTime / this.results.totalRequests;

    console.log('\n' + '='.repeat(70));
    console.log('PERFORMANCE TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Test Duration: ${totalTime.toFixed(2)} seconds`);
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful Requests: ${this.results.successfulRequests}`);
    console.log(`Failed Requests: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Requests per Second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${this.results.minResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${this.results.maxResponseTime.toFixed(2)}ms`);
    
    console.log('\nStatus Code Distribution:');
    Object.entries(this.results.statusCodes).forEach(([code, count]) => {
      const percentage = (count / this.results.totalRequests * 100).toFixed(2);
      console.log(`  ${code}: ${count} (${percentage}%)`);
    });

    console.log('\nEndpoint Performance:');
    Object.entries(this.results.endpointStats).forEach(([endpoint, stats]) => {
      const avgTime = stats.totalResponseTime / stats.totalRequests;
      console.log(`\n  ${endpoint}:`);
      console.log(`    Requests: ${stats.totalRequests}`);
      console.log(`    Avg Response Time: ${avgTime.toFixed(2)}ms`);
      console.log(`    Min/Max: ${stats.minResponseTime.toFixed(2)}ms / ${stats.maxResponseTime.toFixed(2)}ms`);
      
      const statusSummary = Object.entries(stats.statusCodes)
        .map(([code, count]) => `${code}:${count}`)
        .join(', ');
      console.log(`    Status Codes: ${statusSummary}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('PERFORMANCE ASSESSMENT:');
    
    // Performance thresholds
    const thresholds = {
      avgResponseTime: 100, // ms
      successRate: 95, // %
      requestsPerSecond: 50 // req/s
    };

    let assessment = '✅ PASS';
    let issues = [];

    if (avgResponseTime > thresholds.avgResponseTime) {
      issues.push(`High response time (${avgResponseTime.toFixed(2)}ms > ${thresholds.avgResponseTime}ms)`);
      assessment = '⚠️ WARNING';
    }

    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    if (successRate < thresholds.successRate) {
      issues.push(`Low success rate (${successRate.toFixed(2)}% < ${thresholds.successRate}%)`);
      assessment = '⚠️ WARNING';
    }

    if (requestsPerSecond < thresholds.requestsPerSecond) {
      issues.push(`Low throughput (${requestsPerSecond.toFixed(2)} req/s < ${thresholds.requestsPerSecond} req/s)`);
      assessment = '⚠️ WARNING';
    }

    console.log(`Overall: ${assessment}`);
    
    if (issues.length > 0) {
      console.log('\nIssues detected:');
      issues.forEach(issue => console.log(`  • ${issue}`));
    } else {
      console.log('\nAll performance metrics within acceptable ranges.');
    }

    console.log('\nRecommendations:');
    if (avgResponseTime > 200) {
      console.log('  • Optimize database queries for consent recording');
      console.log('  • Consider caching consent checks for frequent requests');
      console.log('  • Review Supabase RPC function performance');
    }
    
    if (successRate < 95) {
      console.log('  • Investigate failed requests (check authentication, validation)');
      console.log('  • Review error handling and retry logic');
    }

    console.log('');
  }
}

async function main() {
  try {
    const tester = new PerformanceTester();
    await tester.runConcurrentTest();
    tester.printResults();
    
    // Exit with appropriate code
    const successRate = tester.results.successfulRequests / tester.results.totalRequests;
    process.exit(successRate >= 0.95 ? 0 : 1);
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

main();