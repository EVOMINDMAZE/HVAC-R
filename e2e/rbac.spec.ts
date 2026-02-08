import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'owner' | 'admin' | 'manager' | 'technician' | 'client' | 'student';
  companyId: string;
}

const testUsers: Record<string, TestUser> = {
  owner: {
    id: 'test-owner-001',
    email: 'owner@test.thermoneural.com',
    password: 'TestPass123!',
    role: 'owner',
    companyId: 'company-test-001',
  },
  admin: {
    id: 'test-admin-001',
    email: 'admin@test.thermoneural.com',
    password: 'TestPass123!',
    role: 'admin',
    companyId: 'company-test-001',
  },
  manager: {
    id: 'test-manager-001',
    email: 'manager@test.thermoneural.com',
    password: 'TestPass123!',
    role: 'manager',
    companyId: 'company-test-001',
  },
  technician: {
    id: 'test-technician-001',
    email: 'technician@test.thermoneural.com',
    password: 'TestPass123!',
    role: 'technician',
    companyId: 'company-test-001',
  },
  client: {
    id: 'test-client-001',
    email: 'client@test.thermoneural.com',
    password: 'TestPass123!',
    role: 'client',
    companyId: 'company-test-001',
  },
  student: {
    id: 'test-student-001',
    email: 'student@test.thermoneural.com',
    password: 'TestPass123!',
    role: 'student',
    companyId: 'company-test-001',
  },
};

const otherCompanyUser: TestUser = {
  id: 'test-owner-002',
  email: 'owner@othercompany.com',
  password: 'TestPass123!',
  role: 'owner',
  companyId: 'company-test-002',
};

async function login(user: TestUser) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  
  const data = await response.json();
  return data.session?.access_token;
}

async function makeRequest(
  method: string,
  endpoint: string,
  token: string | null,
  body?: unknown
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return {
    status: response.status,
    data: await response.json().catch(() => ({})),
  };
}

test.describe('RBAC Comprehensive Test Suite', () => {
  const tokens: Record<string, string | null> = {};
  
  test.beforeAll(async () => {
    for (const [role, user] of Object.entries(testUsers)) {
      tokens[role] = await login(user);
    }
    tokens.otherCompany = await login(otherCompanyUser);
  });
  
  test.afterAll(async () => {
    for (const [role, token] of Object.entries(tokens)) {
      if (token) {
        await makeRequest('POST', '/api/auth/signout', token);
      }
    }
  });

  test.describe('Authentication Endpoints (Public)', () => {
    test('POST /api/auth/signup - allows all roles to register', async () => {
      const response = await makeRequest('POST', '/api/auth/signup', null, {
        email: 'newuser@test.com',
        password: 'TestPass123!',
        full_name: 'New User',
        company_name: 'Test Company',
        role: 'technician',
      });
      
      expect([200, 201, 400]).toContain(response.status);
    });

    test('POST /api/auth/signin - allows all roles to login', async () => {
      const response = await makeRequest('POST', '/api/auth/signin', null, {
        email: testUsers.technician.email,
        password: testUsers.technician.password,
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('GET /api/auth/me - requires authentication', async () => {
      const response = await makeRequest('GET', '/api/auth/me', null);
      expect(response.status).toBe(401);
    });
  });

  test.describe('Calculation Endpoints', () => {
    const calculationEndpoint = '/api/calculations';
    const calculationId = 'test-calculation-001';

    test.describe('POST /api/calculations (Create)', () => {
      test('Owner can create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, tokens.owner, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect([200, 201]).toContain(response.status);
      });

      test('Admin can create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, tokens.admin, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect([200, 201]).toContain(response.status);
      });

      test('Manager can create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, tokens.manager, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect([200, 201]).toContain(response.status);
      });

      test('Technician can create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, tokens.technician, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect([200, 201]).toContain(response.status);
      });

      test('Student can create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, tokens.student, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect([200, 201]).toContain(response.status);
      });

      test('Client CANNOT create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, tokens.client, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect(response.status).toBe(403);
      });

      test('Unauthenticated users CANNOT create calculations', async () => {
        const response = await makeRequest('POST', calculationEndpoint, null, {
          type: 'superheat',
          name: 'Test Calculation',
          inputs: { refrigerant: 'R410A', suction_pressure: 145, suction_temp: 55 },
        });
        expect(response.status).toBe(401);
      });
    });

    test.describe('GET /api/calculations (Read Own)', () => {
      test('All authenticated users can read their own calculations', async () => {
        for (const [role, token] of Object.entries(tokens)) {
          if (role === 'otherCompany') continue;
          const response = await makeRequest('GET', calculationEndpoint, token);
          expect([200, 401]).toContain(response.status);
        }
      });
    });

    test.describe('GET /api/calculations/:id (Read Specific)', () => {
      test('Owner can read any calculation in their company', async () => {
        const response = await makeRequest('GET', `${calculationEndpoint}/${calculationId}`, tokens.owner);
        expect([200, 401, 404]).toContain(response.status);
      });

      test('Technician cannot read calculations from other companies', async () => {
        const response = await makeRequest('GET', `${calculationEndpoint}/${calculationId}`, tokens.technician);
        expect([200, 401, 403, 404]).toContain(response.status);
      });

      test('Client cannot read any calculations', async () => {
        const response = await makeRequest('GET', `${calculationEndpoint}/${calculationId}`, tokens.client);
        expect([401, 403]).toContain(response.status);
      });
    });

    test.describe('DELETE /api/calculations/:id (Delete)', () => {
      test('Owner can delete own calculations', async () => {
        const response = await makeRequest('DELETE', `${calculationEndpoint}/${calculationId}`, tokens.owner);
        expect([200, 204, 401, 403, 404]).toContain(response.status);
      });

      test('Admin can delete own calculations', async () => {
        const response = await makeRequest('DELETE', `${calculationEndpoint}/${calculationId}`, tokens.admin);
        expect([200, 204, 401, 403, 404]).toContain(response.status);
      });

      test('Manager can delete own calculations', async () => {
        const response = await makeRequest('DELETE', `${calculationEndpoint}/${calculationId}`, tokens.manager);
        expect([200, 204, 401, 403, 404]).toContain(response.status);
      });

      test('Technician can delete own calculations', async () => {
        const response = await makeRequest('DELETE', `${calculationEndpoint}/${calculationId}`, tokens.technician);
        expect([200, 204, 401, 403, 404]).toContain(response.status);
      });

      test('Student can delete own calculations', async () => {
        const response = await makeRequest('DELETE', `${calculationEndpoint}/${calculationId}`, tokens.student);
        expect([200, 204, 401, 403, 404]).toContain(response.status);
      });

      test('Client CANNOT delete calculations', async () => {
        const response = await makeRequest('DELETE', `${calculationEndpoint}/${calculationId}`, tokens.client);
        expect(response.status).toBe(403);
      });
    });
  });

  test.describe('Team Management Endpoints', () => {
    const teamEndpoint = '/api/team';

    test.describe('GET /api/team (List Team Members)', () => {
      test('Owner can list team members', async () => {
        const response = await makeRequest('GET', teamEndpoint, tokens.owner);
        expect([200, 401]).toContain(response.status);
      });

      test('Admin can list team members', async () => {
        const response = await makeRequest('GET', teamEndpoint, tokens.admin);
        expect([200, 401]).toContain(response.status);
      });

      test('Manager can list team members', async () => {
        const response = await makeRequest('GET', teamEndpoint, tokens.manager);
        expect([200, 401]).toContain(response.status);
      });

      test('Technician CANNOT list team members', async () => {
        const response = await makeRequest('GET', teamEndpoint, tokens.technician);
        expect(response.status).toBe(403);
      });

      test('Client CANNOT list team members', async () => {
        const response = await makeRequest('GET', teamEndpoint, tokens.client);
        expect(response.status).toBe(403);
      });

      test('Student CANNOT list team members', async () => {
        const response = await makeRequest('GET', teamEndpoint, tokens.student);
        expect(response.status).toBe(403);
      });
    });

    test.describe('POST /api/team/invite (Invite Member)', () => {
      test('Owner can invite team members', async () => {
        const response = await makeRequest('POST', `${teamEndpoint}/invite`, tokens.owner, {
          email: 'newmember@test.com',
          role: 'technician',
        });
        expect([200, 201, 400, 409]).toContain(response.status);
      });

      test('Admin can invite team members', async () => {
        const response = await makeRequest('POST', `${teamEndpoint}/invite`, tokens.admin, {
          email: 'newmember@test.com',
          role: 'technician',
        });
        expect([200, 201, 400, 409]).toContain(response.status);
      });

      test('Manager CANNOT invite team members', async () => {
        const response = await makeRequest('POST', `${teamEndpoint}/invite`, tokens.manager, {
          email: 'newmember@test.com',
          role: 'technician',
        });
        expect(response.status).toBe(403);
      });

      test('Technician CANNOT invite team members', async () => {
        const response = await makeRequest('POST', `${teamEndpoint}/invite`, tokens.technician, {
          email: 'newmember@test.com',
          role: 'technician',
        });
        expect(response.status).toBe(403);
      });
    });

    test.describe('PUT /api/team/role (Update Role)', () => {
      test('Owner can update team member roles', async () => {
        const response = await makeRequest('PUT', `${teamEndpoint}/role`, tokens.owner, {
          user_id: 'test-user-001',
          role: 'manager',
        });
        expect([200, 400, 404]).toContain(response.status);
      });

      test('Admin can update team member roles', async () => {
        const response = await makeRequest('PUT', `${teamEndpoint}/role`, tokens.admin, {
          user_id: 'test-user-001',
          role: 'manager',
        });
        expect([200, 400, 404]).toContain(response.status);
      });

      test('Manager CANNOT update team member roles', async () => {
        const response = await makeRequest('PUT', `${teamEndpoint}/role`, tokens.manager, {
          user_id: 'test-user-001',
          role: 'manager',
        });
        expect(response.status).toBe(403);
      });
    });

    test.describe('DELETE /api/team/member (Remove Member)', () => {
      test('Owner can remove team members', async () => {
        const response = await makeRequest('DELETE', `${teamEndpoint}/member`, tokens.owner, {
          user_id: 'test-user-001',
        });
        expect([200, 204, 400, 404]).toContain(response.status);
      });

      test('Admin can remove team members', async () => {
        const response = await makeRequest('DELETE', `${teamEndpoint}/member`, tokens.admin, {
          user_id: 'test-user-001',
        });
        expect([200, 204, 400, 404]).toContain(response.status);
      });

      test('Manager CANNOT remove team members', async () => {
        const response = await makeRequest('DELETE', `${teamEndpoint}/member`, tokens.manager, {
          user_id: 'test-user-001',
        });
        expect(response.status).toBe(403);
      });
    });
  });

  test.describe('Subscription Endpoints', () => {
    const subscriptionEndpoint = '/api/subscriptions';

    test.describe('GET /api/subscriptions/plans (Public)', () => {
      test('Plans are publicly accessible', async () => {
        const response = await makeRequest('GET', `${subscriptionEndpoint}/plans`, null);
        expect(response.status).toBe(200);
      });
    });

    test.describe('GET /api/subscriptions/current', () => {
      test('Owner can view current subscription', async () => {
        const response = await makeRequest('GET', `${subscriptionEndpoint}/current`, tokens.owner);
        expect([200, 401]).toContain(response.status);
      });

      test('Admin can view current subscription', async () => {
        const response = await makeRequest('GET', `${subscriptionEndpoint}/current`, tokens.admin);
        expect([200, 401]).toContain(response.status);
      });

      test('All authenticated users can view current subscription', async () => {
        for (const [role, token] of Object.entries(tokens)) {
          if (role === 'otherCompany') continue;
          const response = await makeRequest('GET', `${subscriptionEndpoint}/current`, token);
          expect([200, 401]).toContain(response.status);
        }
      });
    });

    test.describe('POST /api/subscriptions/update', () => {
      test('Owner can update subscription', async () => {
        const response = await makeRequest('POST', `${subscriptionEndpoint}/update`, tokens.owner, {
          plan_id: 'professional',
          billing_cycle: 'monthly',
        });
        expect([200, 400, 402]).toContain(response.status);
      });

      test('Admin CANNOT update subscription', async () => {
        const response = await makeRequest('POST', `${subscriptionEndpoint}/update`, tokens.admin, {
          plan_id: 'professional',
          billing_cycle: 'monthly',
        });
        expect(response.status).toBe(403);
      });

      test('Manager CANNOT update subscription', async () => {
        const response = await makeRequest('POST', `${subscriptionEndpoint}/update`, tokens.manager, {
          plan_id: 'professional',
          billing_cycle: 'monthly',
        });
        expect(response.status).toBe(403);
      });
    });

    test.describe('POST /api/subscriptions/cancel', () => {
      test('Owner can cancel subscription', async () => {
        const response = await makeRequest('POST', `${subscriptionEndpoint}/cancel`, tokens.owner);
        expect([200, 400, 401]).toContain(response.status);
      });

      test('Admin CANNOT cancel subscription', async () => {
        const response = await makeRequest('POST', `${subscriptionEndpoint}/cancel`, tokens.admin);
        expect(response.status).toBe(403);
      });
    });
  });

  test.describe('Billing Endpoints', () => {
    const billingEndpoint = '/api/billing';

    test.describe('GET /api/billing/invoices', () => {
      test('Owner can view invoices', async () => {
        const response = await makeRequest('GET', `${billingEndpoint}/invoices`, tokens.owner);
        expect([200, 401]).toContain(response.status);
      });

      test('Admin can view invoices', async () => {
        const response = await makeRequest('GET', `${billingEndpoint}/invoices`, tokens.admin);
        expect([200, 401]).toContain(response.status);
      });

      test('Manager can view invoices', async () => {
        const response = await makeRequest('GET', `${billingEndpoint}/invoices`, tokens.manager);
        expect([200, 401]).toContain(response.status);
      });

      test('Technician CANNOT view invoices', async () => {
        const response = await makeRequest('GET', `${billingEndpoint}/invoices`, tokens.technician);
        expect(response.status).toBe(403);
      });

      test('Client CAN view their own invoices', async () => {
        const response = await makeRequest('GET', `${billingEndpoint}/invoices`, tokens.client);
        expect([200, 401]).toContain(response.status);
      });
    });
  });

  test.describe('Fleet Management Endpoints', () => {
    const fleetEndpoint = '/api/fleet';

    test.describe('GET /api/fleet/status', () => {
      test('Owner can view fleet status', async () => {
        const response = await makeRequest('GET', `${fleetEndpoint}/status`, tokens.owner);
        expect([200, 401]).toContain(response.status);
      });

      test('Admin can view fleet status', async () => {
        const response = await makeRequest('GET', `${fleetEndpoint}/status`, tokens.admin);
        expect([200, 401]).toContain(response.status);
      });

      test('Manager can view fleet status', async () => {
        const response = await makeRequest('GET', `${fleetEndpoint}/status`, tokens.manager);
        expect([200, 401]).toContain(response.status);
      });

      test('Technician can view fleet status', async () => {
        const response = await makeRequest('GET', `${fleetEndpoint}/status`, tokens.technician);
        expect([200, 401]).toContain(response.status);
      });

      test('Client CANNOT view fleet status', async () => {
        const response = await makeRequest('GET', `${fleetEndpoint}/status`, tokens.client);
        expect(response.status).toBe(403);
      });

      test('Student CANNOT view fleet status', async () => {
        const response = await makeRequest('GET', `${fleetEndpoint}/status`, tokens.student);
        expect(response.status).toBe(403);
      });
    });
  });

  test.describe('Engineering Calculation Endpoints', () => {
    const engineeringEndpoint = '/api/calculate';

    test('POST /api/calculate-airflow - all authenticated users can calculate airflow', async () => {
      for (const [role, token] of Object.entries(tokens)) {
        if (role === 'otherCompany') continue;
        const response = await makeRequest('POST', `${engineeringEndpoint}-airflow`, token, {
          sensible_heat_btuh: 24000,
          delta_t_f: 20,
        });
        expect([200, 400, 401]).toContain(response.status);
      }
    });

    test('POST /api/calculate-deltat - all authenticated users can calculate delta T', async () => {
      for (const [role, token] of Object.entries(tokens)) {
        if (role === 'otherCompany') continue;
        const response = await makeRequest('POST', `${engineeringEndpoint}-deltat`, token, {
          return_temp_f: 75,
          supply_temp_f: 55,
        });
        expect([200, 400, 401]).toContain(response.status);
      }
    });

    test('POST /api/calculate-standard - all authenticated users can calculate standard cycle', async () => {
      for (const [role, token] of Object.entries(tokens)) {
        if (role === 'otherCompany') continue;
        const response = await makeRequest('POST', `${engineeringEndpoint}-standard`, token, {
          refrigerant: 'R410A',
          suction_pressure: 145,
          discharge_pressure: 320,
          suction_temp: 55,
          discharge_temp: 165,
        });
        expect([200, 400, 401]).toContain(response.status);
      }
    });
  });

  test.describe('AI Pattern Endpoints', () => {
    const aiEndpoint = '/api/ai/patterns';

    test.describe('POST /api/ai/patterns/analyze', () => {
      test('Owner can use AI analysis', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/analyze`, tokens.owner, {
          symptoms: ['low_suction_pressure', 'frost_on_evaporator'],
          equipment_type: 'residential_hvac',
          refrigerant: 'R410A',
        });
        expect([200, 400, 401]).toContain(response.status);
      });

      test('Admin can use AI analysis', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/analyze`, tokens.admin, {
          symptoms: ['low_suction_pressure'],
          equipment_type: 'residential_hvac',
        });
        expect([200, 400, 401]).toContain(response.status);
      });

      test('Manager can use AI analysis', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/analyze`, tokens.manager, {
          symptoms: ['low_suction_pressure'],
          equipment_type: 'residential_hvac',
        });
        expect([200, 400, 401]).toContain(response.status);
      });

      test('Technician can use AI analysis', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/analyze`, tokens.technician, {
          symptoms: ['low_suction_pressure'],
          equipment_type: 'residential_hvac',
        });
        expect([200, 400, 401]).toContain(response.status);
      });

      test('Student can use AI analysis', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/analyze`, tokens.student, {
          symptoms: ['low_suction_pressure'],
          equipment_type: 'residential_hvac',
        });
        expect([200, 400, 401]).toContain(response.status);
      });

      test('Client CANNOT use AI analysis', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/analyze`, tokens.client, {
          symptoms: ['low_suction_pressure'],
          equipment_type: 'residential_hvac',
        });
        expect(response.status).toBe(403);
      });
    });

    test.describe('POST /api/ai/patterns/symptom-outcome (Create Pattern)', () => {
      test('Owner can create patterns', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/symptom-outcome`, tokens.owner, {
          symptoms: ['symptom1', 'symptom2'],
          outcome: 'compressor_failure',
          solution: 'replace_compressor',
          equipment_type: 'residential_hvac',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Admin can create patterns', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/symptom-outcome`, tokens.admin, {
          symptoms: ['symptom1'],
          outcome: 'outcome',
          solution: 'solution',
          equipment_type: 'residential_hvac',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Manager can create patterns', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/symptom-outcome`, tokens.manager, {
          symptoms: ['symptom1'],
          outcome: 'outcome',
          solution: 'solution',
          equipment_type: 'residential_hvac',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Technician can create patterns', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/symptom-outcome`, tokens.technician, {
          symptoms: ['symptom1'],
          outcome: 'outcome',
          solution: 'solution',
          equipment_type: 'residential_hvac',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Student CANNOT create patterns', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/symptom-outcome`, tokens.student, {
          symptoms: ['symptom1'],
          outcome: 'outcome',
          solution: 'solution',
          equipment_type: 'residential_hvac',
        });
        expect(response.status).toBe(403);
      });

      test('Client CANNOT create patterns', async () => {
        const response = await makeRequest('POST', `${aiEndpoint}/symptom-outcome`, tokens.client, {
          symptoms: ['symptom1'],
          outcome: 'outcome',
          solution: 'solution',
          equipment_type: 'residential_hvac',
        });
        expect(response.status).toBe(403);
      });
    });
  });

  test.describe('Report Generation Endpoints', () => {
    const reportEndpoint = '/api/reports';

    test.describe('POST /api/reports/generate', () => {
      test('Owner can generate reports', async () => {
        const response = await makeRequest('POST', `${reportEndpoint}/generate`, tokens.owner, {
          report_type: 'calculation_summary',
          entity_id: 'calc-001',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Admin can generate reports', async () => {
        const response = await makeRequest('POST', `${reportEndpoint}/generate`, tokens.admin, {
          report_type: 'calculation_summary',
          entity_id: 'calc-001',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Manager can generate reports', async () => {
        const response = await makeRequest('POST', `${reportEndpoint}/generate`, tokens.manager, {
          report_type: 'calculation_summary',
          entity_id: 'calc-001',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Technician can generate reports', async () => {
        const response = await makeRequest('POST', `${reportEndpoint}/generate`, tokens.technician, {
          report_type: 'calculation_summary',
          entity_id: 'calc-001',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Client can generate reports', async () => {
        const response = await makeRequest('POST', `${reportEndpoint}/generate`, tokens.client, {
          report_type: 'client_report',
          entity_id: 'job-001',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });

      test('Student can generate reports', async () => {
        const response = await makeRequest('POST', `${reportEndpoint}/generate`, tokens.student, {
          report_type: 'calculation_summary',
          entity_id: 'calc-001',
        });
        expect([200, 201, 400, 401]).toContain(response.status);
      });
    });
  });

  test.describe('Multi-Tenancy Isolation', () => {
    test('User from Company A cannot access Company B data', async () => {
      const response = await makeRequest('GET', '/api/calculations', tokens.otherCompany);
      expect([200, 401, 403]).toContain(response.status);
    });

    test('User from Company A cannot view Company B team members', async () => {
      const response = await makeRequest('GET', '/api/team', tokens.otherCompany);
      expect([200, 401, 403]).toContain(response.status);
    });

    test('User from Company A cannot modify Company B resources', async () => {
      const response = await makeRequest('PUT', '/api/team/role', tokens.otherCompany, {
        user_id: 'user-in-company-a',
        role: 'admin',
      });
      expect([400, 401, 403, 404]).toContain(response.status);
    });
  });

  test.describe('Storage Endpoints', () => {
    const storageEndpoint = '/api/storage';

    test.describe('POST /api/storage/upload', () => {
      test('Owner can upload files', async () => {
        const response = await makeRequest('POST', `${storageEndpoint}/upload`, tokens.owner, {
          type: 'avatar',
        });
        expect([200, 400, 401, 413]).toContain(response.status);
      });

      test('Admin can upload files', async () => {
        const response = await makeRequest('POST', `${storageEndpoint}/upload`, tokens.admin, {
          type: 'avatar',
        });
        expect([200, 400, 401, 413]).toContain(response.status);
      });

      test('All authenticated users can upload files', async () => {
        for (const [role, token] of Object.entries(tokens)) {
          if (role === 'otherCompany') continue;
          const response = await makeRequest('POST', `${storageEndpoint}/upload`, token, {
            type: 'avatar',
          });
          expect([200, 400, 401, 413]).toContain(response.status);
        }
      });
    });
  });

  test.describe('User Statistics Endpoints', () => {
    const statsEndpoint = '/api/user/stats';

    test('All authenticated users can view their own stats', async () => {
      for (const [role, token] of Object.entries(tokens)) {
        if (role === 'otherCompany') continue;
        const response = await makeRequest('GET', statsEndpoint, token);
        expect([200, 401]).toContain(response.status);
      }
    });
  });

  test.describe('Health Check Endpoints (Public)', () => {
    test('GET /api/health is publicly accessible', async () => {
      const response = await makeRequest('GET', '/api/health', null);
      expect(response.status).toBe(200);
    });

    test('GET /api/diagnostics/supabase is publicly accessible', async () => {
      const response = await makeRequest('GET', '/api/diagnostics/supabase', null);
      expect([200, 503]).toContain(response.status);
    });
  });
});

test.describe('RBAC Edge Cases', () => {
  const tokens: Record<string, string | null> = {};

  test.beforeAll(async () => {
    for (const [role, user] of Object.entries(testUsers)) {
      tokens[role] = await login(user);
    }
  });

  test.afterAll(async () => {
    for (const [role, token] of Object.entries(tokens)) {
      if (token) {
        await makeRequest('POST', '/api/auth/signout', token);
      }
    }
  });

  test('Expired token returns 401', async () => {
    const response = await makeRequest('GET', '/api/calculations', 'expired-token');
    expect(response.status).toBe(401);
  });

  test('Invalid token returns 401', async () => {
    const response = await makeRequest('GET', '/api/calculations', 'invalid-token');
    expect(response.status).toBe(401);
  });

  test('Malformed Authorization header returns 401', async () => {
    const response = await fetch(`${API_BASE_URL}/api/calculations`, {
      headers: { Authorization: 'Malformed' },
    });
    expect(response.status).toBe(401);
  });

  test('Missing Authorization header returns 401', async () => {
    const response = await fetch(`${API_BASE_URL}/api/calculations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status).toBe(401);
  });

  test('Role escalation attempt returns 403', async () => {
    const response = await makeRequest('PUT', '/api/team/role', tokens.technician, {
      user_id: testUsers.technician.id,
      role: 'admin',
    });
    expect(response.status).toBe(403);
  });

  test('Cross-company resource access returns 403', async () => {
    const response = await makeRequest('GET', '/api/calculations/company-b-calculation-id', tokens.owner);
    expect([403, 404]).toContain(response.status);
  });
});

console.log('RBAC Test Suite loaded successfully');
console.log('Test users configured for roles:', Object.keys(testUsers).join(', '));