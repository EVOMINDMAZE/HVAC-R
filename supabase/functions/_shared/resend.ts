
export const sendEmail = async (to: string, subject: string, html: string) => {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
        console.error('RESEND_API_KEY is not set in Edge Function Secrets.');
        return { ok: false, error: 'Misconfigured server: RESEND_API_KEY missing' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Team <team@thermoneural.com>', // Default sender, can be customized
                to,
                subject,
                html,
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Resend API Error:', errorData);
            return { ok: false, error: errorData };
        }

        const data = await res.json();
        return { ok: true, data };

    } catch (error) {
        console.error('Fetch Error in sendEmail:', error);
        return { ok: false, error: error.message };
    }
};
