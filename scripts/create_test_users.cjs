
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rxqflxmzsqhqrzffcsej.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjYxMCwiZXhwIjoyMDY4ODgyNjEwfQ.qBMpMscAPAXRXJYRyIkuqO4a9QDUb2lSYgpI2voNBJ0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const users = [
    { email: 'student@test.com', role: 'student', password: 'Password123!' },
    { email: 'tech@test.com', role: 'technician', password: 'Password123!' },
    { email: 'client@test.com', role: 'client', password: 'Password123!' },
    { email: 'admin@admin.com', role: 'admin', password: 'ThermoAdmin$2026!' }
];

async function getOrCreateUser(u) {
    console.log(`\nProcessing user: ${u.email} [${u.role}]`);

    // 1. Create or Find User
    let userId;
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.role.toUpperCase() }
    });

    if (createData.user) {
        console.log(`Created new user: ${createData.user.id}`);
        userId = createData.user.id;
    } else if (createError?.message?.includes("already registered") || createError?.status === 422) {
        console.log("User already exists. Finding ID...");
        // List users to find ID
        const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listError) {
            console.error("Failed to list users:", listError);
            return null;
        }
        const found = allUsers.find(x => x.email === u.email);
        if (found) {
            userId = found.id;
            console.log(`Found ID: ${userId}`);

            // Check if we need to update password (always do it to be safe)
            if (u.password) {
                const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: u.password });
                if (updateError) {
                    console.error(`Failed to update password for ${u.email}:`, updateError);
                } else {
                    console.log(`Password updated/verified for ${u.email}`);
                }
            }
        } else {
            console.error("Could not find user in list.");
            return null;
        }
    } else {
        console.error("Failed to create user:", createError);
        return null;
    }
    return userId;
}

async function run() {
    // 1. Setup Student (Business Owner) first, as others depend on their Company ID
    const studentUser = users.find(u => u.role === 'student');
    const studentId = await getOrCreateUser(studentUser);

    let companyId;
    if (studentId) {
        // Create Company
        console.log("Upserting Company for Student...");
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .upsert({
                user_id: studentId,
                name: 'Student HVAC Academy Co',
                primary_color: '#000000'
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (companyError) {
            console.error("Error creating company:", companyError);
        } else {
            console.log(`Company ID: ${company.id}`);
            companyId = company.id;

            // Assign Role
            console.log("Assigning Student Role...");
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: studentId,
                    role: 'student',
                    company_id: companyId
                }, { onConflict: 'user_id' });

            if (roleError) console.error("Error setting student role:", roleError);
            else console.log("Success: Student Role Set");
        }
    }

    if (!companyId) {
        console.error("Cannot proceed without Company ID (Student setup failed)");
        return;
    }

    // 2. Setup Technician (Employee of Student)
    const techUser = users.find(u => u.role === 'technician');
    const techId = await getOrCreateUser(techUser);
    if (techId) {
        console.log(`Assigning Technician Role (Company: ${companyId})...`);
        const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
                user_id: techId,
                role: 'technician',
                company_id: companyId
            }, { onConflict: 'user_id' });

        if (roleError) console.error("Error setting technician role:", roleError);
        else console.log("Success: Technician Role Set");
    }

    // 3. Setup Client (Customer of Student)
    const clientUser = users.find(u => u.role === 'client');
    const clientId = await getOrCreateUser(clientUser);
    if (clientId) {
        // Create Client Record first
        console.log("Creating Client Profile...");
        // Check if exists
        const { data: existingClients } = await supabase
            .from('clients')
            .select('id')
            .eq('contact_email', clientUser.email)
            .eq('company_id', companyId);

        let clientProfileId;
        if (existingClients && existingClients.length > 0) {
            clientProfileId = existingClients[0].id;
            console.log(`Found existing Client Profile: ${clientProfileId}`);
        } else {
            const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert({
                    company_id: companyId,
                    name: 'Test Homeowner',
                    contact_email: clientUser.email,
                    contact_name: 'John Doe'
                })
                .select()
                .single();

            if (clientError) {
                console.error("Error creating client profile:", clientError);
            } else {
                clientProfileId = newClient.id;
                console.log(`Created Client Profile: ${clientProfileId}`);
            }
        }

        if (clientProfileId) {
            console.log(`Assigning Client Role (Client Profile: ${clientProfileId})...`);
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: clientId,
                    role: 'client',
                    client_id: clientProfileId
                }, { onConflict: 'user_id' });

            if (roleError) console.error("Error setting client role:", roleError);
            else console.log("Success: Client Role Set");
        }
    }

    // 4. Setup Admin (Legacy)
    const adminUser = users.find(u => u.role === 'admin');
    const adminId = await getOrCreateUser(adminUser);
    if (adminId) {
        // Admin also needs a company usually
        console.log("Upserting Company for Admin...");
        const { data: adminComp, error: adminCompError } = await supabase
            .from('companies')
            .upsert({
                user_id: adminId,
                name: 'ThermoNeural HQ',
                primary_color: '#ff0000'
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (adminComp) {
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: adminId,
                    role: 'admin',
                    company_id: adminComp.id
                }, { onConflict: 'user_id' });
            if (roleError) console.error("Error setting admin role:", roleError);
            else console.log("Success: Admin Role Set");
        }
    }
}

run();
