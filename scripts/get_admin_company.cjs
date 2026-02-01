const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rxqflxmzsqhqrzffcsej.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjYxMCwiZXhwIjoyMDY4ODgyNjEwfQ.qBMpMscAPAXRXJYRyIkuqO4a9QDUb2lSYgpI2voNBJ0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminCompany() {
    const { data: user, error: userError } = await supabase.from('auth.users').select('id').eq('email', 'admin@admin.com').single();
    // auth.users is not directly accessible usually via client, but service key might allow...
    // Actually, better to query 'companies' where owner is known or just list companies.

    // Let's try listing companies and their owner emails if possible, or just user_id.
    // We know admin's user_id from logs: e74f92ab-9c58-45d7-9a0c-4adbe6460f65

    const adminId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';

    const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', adminId);

    if (error) {
        console.error('Error fetching company:', error);
        return;
    }

    if (companies && companies.length > 0) {
        console.log('Admin Company ID:', companies[0].id);
        console.log('Admin Company Name:', companies[0].name);
    } else {
        console.log('No company found for Admin ID:', adminId);
    }
}

getAdminCompany();
