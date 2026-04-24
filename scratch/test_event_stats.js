const axios = require('axios');

const API_URL = 'http://localhost:8000/api/admin';
const TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // I'll need to bypass auth or use a test token if possible

async function testStats() {
  try {
    // Note: This test might fail without a valid token, but I'm checking the route registration
    const response = await axios.get(`${API_URL}/getEventDashboardStats`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'devicetype': 'WEB',
        'deviceid': 'test'
      }
    });
    console.log('Stats Response:', response.data);
  } catch (error) {
    console.log('Test caught intentional error (likely unauthorized):', error.response?.status || error.message);
  }
}

testStats();
