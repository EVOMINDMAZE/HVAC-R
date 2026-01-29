
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rxqflxmzsqhqrzffcsej.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjYxMCwiZXhwIjoyMDY4ODgyNjEwfQ.qBMpMscAPAXRXJYRyIkuqO4a9QDUb2lSYgpI2voNBJ0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    const techId = 'c63198bf-8bbf-4499-b918-15a69dbbbde6';
    const clientProfileId = '7c415d88-0ee2-46e6-8c10-29fa003a7390';
    const companyId = '8b00ec9f-1392-420f-a22d-55bd596249d6';

    const teamId = '7a6de43d-4552-4f34-8809-e32ca73045d5'; // Student ID

    console.log("Creating Test Job...");

    const { data, error } = await supabase
        .from('jobs')
        .insert({
            user_id: teamId,
            company_id: companyId,
            client_id: clientProfileId,
            client_name: 'Test Homeowner',
            technician_id: techId,
            title: 'Test HVAC Repair',
            job_name: 'Test HVAC Repair',
            description: 'Fixing the AC unit for testing purposes.',
            status: 'pending',
            scheduled_at: new Date().toISOString(),
            ticket_number: `TKT-${Math.floor(Math.random() * 10000)}`
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating job:", error);
    } else {
        console.log(`Job Created! ID: ${data.id}`);

        // Also ensure a timeline entry exists
        const { error: timelineError } = await supabase
            .from('job_timeline')
            .insert({
                job_id: data.id,
                status: 'pending',
                notes: 'Job created via test script'
            });

        if (timelineError) console.error("Error creating timeline:", timelineError);
    }
}

run();
