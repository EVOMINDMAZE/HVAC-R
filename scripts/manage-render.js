import https from 'https';

const API_KEY = process.env.RENDER_API_KEY;

const serviceId = process.argv[2];
const action = process.argv[3] || 'restart'; // 'restart' or 'deploy'

if (!API_KEY) {
    console.error('Error: RENDER_API_KEY environment variable is not set.');
    process.exit(1);
}

if (!serviceId) {
    console.error('Usage: node scripts/manage-render.js <service_id> [restart|deploy]');
    process.exit(1);
}

const paths = {
    restart: `/v1/services/${serviceId}/restart`,
    deploy: `/v1/services/${serviceId}/deploys`,
    logs: `/v1/logs?resource=${serviceId}&ownerId=tea-d21am0p5pdvs73fn9o30&limit=100`,
    'list-deploys': `/v1/services/${serviceId}/deploys?limit=20`
};

if (!paths[action]) {
    console.error(`Invalid action: ${action}. Use 'restart', 'deploy', 'logs', or 'list-deploys'.`);
    process.exit(1);
}

const options = {
    hostname: 'api.render.com',
    path: paths[action],
    method: (action === 'logs' || action === 'list-deploys') ? 'GET' : 'POST',
    headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
};

console.log(`Triggering ${action} for service ${serviceId}...`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            if (data && data.trim().length > 0) {
                try {
                    const response = JSON.parse(data);
                    if (action === 'logs') {
                        console.log('Logs Response:');
                        console.log(JSON.stringify(response, null, 2));
                    } else {
                        console.log('Success!');
                        console.log(JSON.stringify(response, null, 2));
                    }
                } catch (e) {
                    console.log('Success! (Non-JSON response)');
                    console.log(data);
                }
            } else {
                console.log('Success! (Empty response)');
            }
        } else {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

// Send empty body for restart/deploy, nothing for logs/list-deploys
if (action !== 'logs' && action !== 'list-deploys') {
    req.write('{}');
}
req.end();
