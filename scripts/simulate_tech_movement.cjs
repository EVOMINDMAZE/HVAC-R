const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("🚀 Starting Technician Movement Simulation...");

    // 1. Create a dummy technician user if needed, or just use a random ID?
    // Actually, we need a valid job. Let's create one.

    // First, find or create a client/asset/tech
    // For simplicity, we'll just insert a job with dummy IDs if constraints allow, 
    // but looking at schema, we might need valid references.
    // The previous verify script used `tech@test.com` and inserted it?
    // Let's check verify_realtime_setup.cjs

    // Reuse logic from verify_realtime_setup used to create a job
    const { data: techUser } = await supabase.from('users').select('id').eq('email', 'tech@test.com').single();

    let technician_id = techUser?.id;

    if (!technician_id) {
        console.log("Creating new tech user...");
        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
            email: 'tech@test.com',
            password: 'password123',
            email_confirm: true
        });
        if (userError) {
            // If user already exists but we didn't find it (maybe different table?), try to get it again or fail
            // Actually valid users are in auth.users, but we usually join with public.users or similar.
            // Let's assume the previous script worked, so 'tech@test.com' should be available or creatable.
            // If it failed saying user already exists, we should have found it above.
            // However, we need the UUID.
            console.error("Error creating/finding tech user:", userError);
            process.exit(1);
        }
        technician_id = newUser.user.id;

        // Ensure public.users entry
        await supabase.from('users').upsert({ id: technician_id, email: 'tech@test.com', role: 'technician' });
    }

    // Create Job
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
            title: 'Simulation Job ' + new Date().toISOString(),
            description: 'Verifying realtime updates on map',
            status: 'en_route',
            technician_id: technician_id,
            location_lat: 40.7128,
            location_lng: -74.0060,
            scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

    if (jobError) {
        console.error("❌ Error creating job:", jobError);
        process.exit(1);
    }

    console.log(`✅ Job Created: ${job.id} (Tech: tech@test.com)`);
    console.log(`📍 Initial Location: [40.7128, -74.0060]`);
    console.log(`⏳ Waiting 20 seconds before moving... Get to the Map View!`);
    await new Promise(r => setTimeout(r, 20000));

    console.log(`⏳ Moving for 60 seconds... check the Dispatch Map!`);

    // Simulate Movement
    const startLat = 40.7128;
    const startLng = -74.0060;
    const steps = 30; // 30 steps
    const interval = 2000; // 2 seconds

    for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, interval));

        const newLat = startLat + (i * 0.001);
        const newLng = startLng + (i * 0.001);

        const { error: updateError } = await supabase
            .from('jobs')
            .update({
                location_lat: newLat,
                location_lng: newLng,
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

        if (updateError) {
            console.error("❌ Error updating location:", updateError);
        } else {
            console.log(`🚛 Updated Location: [${newLat.toFixed(4)}, ${newLng.toFixed(4)}]`);
        }
    }

    console.log("✅ Simulation Complete.");
    console.log(`⚠️ Job ${job.id} is still in the database. You may want to delete it manually or use it for further testing.`);
}

run();
