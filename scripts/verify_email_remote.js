
const supabaseUrl = 'https://rxqflxmzsqhqrzffcsej.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDY2MTAsImV4cCI6MjA2ODg4MjYxMH0.MpW545_SkWroAwSd2WIwZ2jp2RNaNf7YGOGLrjyoUAw';

async function testEmail() {
    console.log('Sending test request to review-hunter...');

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/review-hunter`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_id: 'TEST-JOB-123',
                client_name: 'Resend Tester',
                client_email: 'delivered@resend.dev', // Magic email for success
                client_phone: '555-0199',
                tech_name: 'Antigravity Bot'
            })
        });

        const data = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', data);

        if (response.ok) {
            console.log('✅ Email verification SUCCESS!');
        } else {
            console.error('❌ Email verification FAILED.');
        }

    } catch (err) {
        console.error('❌ Request Error:', err);
    }
}

testEmail();
