/**
 * Helper script to clear all leaderboard data
 * Run this while your dev server is running: node clear-leaderboard.js
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/leaderboard/clear',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('Clearing all leaderboard data...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ Success:', result.message);
      } else {
        console.log('❌ Failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error making request:', error.message);
  console.log('\nMake sure your dev server is running with: npm run dev');
});

req.end();
