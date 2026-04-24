const axios = require('axios');

async function testAPI() {
    try {
        const response = await axios.get('http://localhost:8000/api/admin/getTotalAccommodationCount', {
            headers: {
                'devicetype': 'WEB',
                'deviceid': 'admin-panel'
                // Note: Auth might fail if token is required, but let's see if it even reaches
            }
        });
        console.log('API Response:', response.data);
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
    }
}

testAPI();
