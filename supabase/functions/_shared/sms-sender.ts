export interface SmsPayload {
    to: string;
    text: string;
}

export interface SmsResult {
    success: boolean;
    id?: string;
    error?: string;
}

export const sendSms = async (payload: SmsPayload): Promise<SmsResult> => {
    const telnyxApiKey = Deno.env.get('TELNYX_API_KEY');
    // Default to a verified number or env var if provided, otherwise fallback is handled by API validation
    const fromNumber = Deno.env.get('TELNYX_FROM_NUMBER') ?? '+18449983944'; // Example Toll-Free

    if (!telnyxApiKey) {
        console.log(`[Mock SMS] Application would have sent: "${payload.text}" to ${payload.to}`);
        return { success: true, id: 'mock-sms-id' };
    }

    try {
        const response = await fetch('https://api.telnyx.com/v2/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${telnyxApiKey}`,
            },
            body: JSON.stringify({
                from: fromNumber,
                to: payload.to,
                text: payload.text,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Telnyx Error] Status: ${response.status} - ${errorText}`);
            return { success: false, error: errorText };
        }

        const data = await response.json();
        console.log(`[SMS Sent] ID: ${data.data?.id} | To: ${payload.to}`);
        return { success: true, id: data.data?.id };

    } catch (error) {
        console.error(`[SMS Exception] ${error.message}`);
        return { success: false, error: error.message };
    }
};
