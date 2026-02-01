import https from 'https';

const API_KEY = process.env.RENDER_API_KEY;

if (!API_KEY) {
    console.error('Error: RENDER_API_KEY environment variable is not set.');
    process.exit(1);
}

const options = {
    hostname: 'api.render.com',
    path: '/v1/services?limit=20',
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const services = JSON.parse(data);
            console.log('Found Services:');
            services.forEach(service => {
                console.log(`- Name: ${service.service.name}`);
                console.log(`  ID: ${service.service.id}`);
                console.log(`  Slug: ${service.service.slug}`); // Check for slug
                console.log(`  URL: ${service.service.serviceUrl}`);
                console.log(JSON.stringify(service.service, null, 2)); // Uncomment to see full object if needed
                console.log('---');
            });
        } else {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.end();
