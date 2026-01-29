const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://rxqflxmzsqhqrzffcsej.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjYxMCwiZXhwIjoyMDY4ODgyNjEwfQ.qBMpMscAPAXRXJYRyIkuqO4a9QDUb2lSYgpI2voNBJ0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    console.log("🚀 Starting Tracking Flow Verification...");

    // 1. Setup Data - Create a Job
    console.log("1️⃣  Creating Test Job...");

    // We need a technician ID. Let's get 'tech@test.com'
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const techUser = users.find(u => u.email === 'tech@test.com');
    const clientUser = users.find(u => u.email === 'client@test.com');
    const studentUser = users.find(u => u.email === 'student@test.com');

    if (!techUser || !clientUser || !studentUser) {
        console.error("❌ Tech, Client, or Student user not found. Run create_test_users.cjs first.");
        return;
    }

    // Get a client profile ID
    const { data: clientProfile } = await supabase.from('clients').select('id, name').eq('contact_email', 'client@test.com').single();
    if (!clientProfile) { console.error("❌ Client profile not found"); return; }

    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
            user_id: studentUser.id,
            job_name: 'Simulation Test Job ' + Math.floor(Math.random() * 1000),
            client_id: clientProfile.id,
            client_name: clientProfile.name,
            technician_id: techUser.id,
            status: 'pending', // Main table valid status
            scheduled_at: new Date().toISOString(),
            geo_lat: 40.7128,
            geo_lng: -74.0060
        })
        .select()
        .single();

    if (jobError) { console.error("❌ Job create failed:", jobError); return; }
    console.log(`✅ Job Created: ${job.id} (Tech: ${techUser.email})`);

    // 2. Simulate Client Listening (Realtime)
    console.log("\n2️⃣  Starting Client Listener (Realtime)...");

    const channel = supabase
        .channel('tracking_test')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'jobs' },
            (payload) => {
                console.log("🔔 Payload Received:", payload.eventType);
                if (payload.new && payload.old) {
                    console.log(`📡 CLIENT RECEIVED UPDATE: 📍 [${payload.new.geo_lat}, ${payload.new.geo_lng}]`);
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log("✅ Client Subscribed!");
                // Start Movement after subscribed
                startMovement(job.id);
            }
        });

    // 3. Simulate Technician Movement (The 'Simulate' Button)
    async function startMovement(jobId) {
        console.log("\n3️⃣  Simulating Tech Movement (moving North-East)...");
        let lat = 40.7128;
        let lng = -74.0060;

        for (let i = 1; i <= 5; i++) {
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s

            lat += 0.001;
            lng += 0.001;

            console.log(`🚛 TECH UPDATES: [${lat.toFixed(6)}, ${lng.toFixed(6)}] (Step ${i}/5)`);

            const { error } = await supabase
                .from('jobs')
                .update({
                    geo_lat: lat,
                    geo_lng: lng
                })
                .eq('id', jobId);

            if (error) console.error("Update failed:", error);
        }

        console.log("\n✅ Simulation Complete. Cleaning up...");
        // await supabase.from('jobs').delete().eq('id', jobId); // Cleanup disabled for manual verification
        process.exit(0);
    }
}

run();
