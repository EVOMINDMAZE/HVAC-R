
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const { data: jobs } = await supabase.from('jobs').select('id, ticket_number').limit(1);
    if (!jobs || jobs.length === 0) return;
    const targetJob = jobs[0];

    console.log('--- Seeding Map Test Data ---');
    console.log('Target Job:', targetJob.ticket_number, targetJob.id);

    // 1. Reset Main Status to Pending
    await supabase.from('jobs').update({ status: 'pending' }).eq('id', targetJob.id);

    // 2. Insert Timeline Entry for En Route (simulate technician start)
    const { error } = await supabase.from('job_timeline').insert({
        job_id: targetJob.id,
        status: 'en_route',
        note: 'Technician started travel via Debug Script',
        geo_lat: 40.730610, // NYC
        geo_lng: -73.935242
    });

    if (error) console.error('Failed to seed timeline:', error);
    else console.log('✅ Seeded En Route timeline entry.');

    console.log(`Verify Map at: http://localhost:8080/track-job/${targetJob.id}`);
    console.log(`Verify Tech View at: http://localhost:8080/tech/jobs/${targetJob.id}`);
}

main();
