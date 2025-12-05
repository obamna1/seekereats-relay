const https = require('https');

const BASE_URL = 'https://seekereats-relay-backend-production.up.railway.app';
const SECRET = 'seekereats-hackathon-secret-2024';

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: headers
    };
    
    console.log(`\nTesting ${path}...`);
    https.get(`${BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Body:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Body:', data);
        }
        resolve(res.statusCode);
      });
    }).on('error', reject);
  });
}

async function verify() {
  try {
    // 1. Test Health (No Auth)
    const healthStatus = await makeRequest('/health');
    if (healthStatus === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }

    // 2. Test Config (With Auth)
    const configStatus = await makeRequest('/relay/config', {
      'X-Relay-Secret': SECRET
    });
    if (configStatus === 200) {
      console.log('✅ Auth check passed');
    } else {
      console.log('❌ Auth check failed');
    }

  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verify();
