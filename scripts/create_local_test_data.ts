import {
  db,
  ensureDbInitialized,
  userDb,
  teamDb,
} from "../server/database/index.js";
import bcrypt from "bcryptjs";

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "tech";
  id?: number;
}

async function createTestData() {
  try {
    console.log("Creating test data for team functionality...");
    ensureDbInitialized();

    // Clear existing test data
    db.prepare(
      "DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)",
    ).run("%@test.com");
    db.prepare("DELETE FROM companies WHERE name LIKE ?").run("%Test Company%");
    db.prepare("DELETE FROM users WHERE email LIKE ?").run("%@test.com");

    // Create test users
    const users: TestUser[] = [
      {
        email: "admin@test.com",
        password: "Password123!",
        firstName: "Admin",
        lastName: "Test",
        role: "admin",
      },
      {
        email: "manager@test.com",
        password: "Password123!",
        firstName: "Manager",
        lastName: "Test",
        role: "manager",
      },
      {
        email: "tech1@test.com",
        password: "Password123!",
        firstName: "Tech",
        lastName: "One",
        role: "tech",
      },
      {
        email: "tech2@test.com",
        password: "Password123!",
        firstName: "Tech",
        lastName: "Two",
        role: "tech",
      },
    ];

    const createdUsers: TestUser[] = [];
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const result = (userDb.create as any).run(
        user.email,
        passwordHash,
        user.firstName,
        user.lastName,
        "Test Company",
        user.role,
        "555-1234",
      );

      const userId = result.lastInsertRowid;
      const createdUser = { ...user, id: userId as number };
      createdUsers.push(createdUser);
      console.log(`Created user: ${user.email} (ID: ${userId})`);
    }

    // Create a test company
    const adminUser = createdUsers.find((u) => u.role === "admin");
    if (adminUser && adminUser.id) {
      const companyResult = db
        .prepare(
          `
        INSERT INTO companies (name, user_id, seat_limit) 
        VALUES (?, ?, ?)
      `,
        )
        .run("Test Company", adminUser.id, 10);

      const companyId = companyResult.lastInsertRowid;
      console.log(`Created company: Test Company (ID: ${companyId})`);

      // Add users to company roles
      for (const user of createdUsers) {
        if (user.id) {
          (teamDb.createOrUpdate as any).run(
            user.id,
            user.role,
            companyId,
            null,
          );
          console.log(`Added ${user.email} as ${user.role} to company`);
        }
      }
    }

    // Create a client for testing
    const clientResult = db
      .prepare(
        `
      INSERT INTO clients (company_id, name, contact_name, contact_phone, contact_email, address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        1, // companyId
        "Test Client Corp",
        "John Doe",
        "555-9876",
        "client@test.com",
        "123 Main St, Test City",
      );
    console.log(`Created client: Test Client Corp`);

    console.log("Test data created successfully!");
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData();
}

export { createTestData };
