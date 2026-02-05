/**
 * API Test Suite for Agentic Honey-Pot
 * Use this to test your API before submission
 * 
 * Run: node tests/api-test.js
 */

const http = require('http');

// Configuration - Update these!
const API_URL = 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your-secret-api-key';

// Test messages simulating different scam types
const TEST_SCENARIOS = [
  {
    name: 'Bank Fraud - Account Block Threat',
    message: {
      sessionId: 'test-bank-fraud-001',
      message: {
        sender: 'scammer',
        text: 'Dear Customer, Your SBI account has been blocked due to incomplete KYC. Update immediately to avoid permanent suspension. Call 9876543210.',
        timestamp: Date.now()
      },
      conversationHistory: [],
      metadata: { channel: 'SMS', language: 'English', locale: 'IN' }
    }
  },
  {
    name: 'UPI Fraud - Payment Request',
    message: {
      sessionId: 'test-upi-fraud-001',
      message: {
        sender: 'scammer',
        text: 'Congratulations! You have won Rs.50000 cashback. To claim, send Rs.500 processing fee to scammer@upi immediately.',
        timestamp: Date.now()
      },
      conversationHistory: [],
      metadata: { channel: 'WhatsApp', language: 'English', locale: 'IN' }
    }
  },
  {
    name: 'OTP Fraud - Credential Theft',
    message: {
      sessionId: 'test-otp-fraud-001',
      message: {
        sender: 'scammer',
        text: 'This is HDFC Bank. Your account shows suspicious activity. Please share the OTP sent to your phone to verify and secure your account.',
        timestamp: Date.now()
      },
      conversationHistory: [],
      metadata: { channel: 'SMS', language: 'English', locale: 'IN' }
    }
  },
  {
    name: 'Job Scam - Work From Home',
    message: {
      sessionId: 'test-job-scam-001',
      message: {
        sender: 'scammer',
        text: 'Hello! We have a work from home opportunity. Earn Rs.30000/week with just 2 hours of data entry. Registration fee only Rs.1000. Interested?',
        timestamp: Date.now()
      },
      conversationHistory: [],
      metadata: { channel: 'WhatsApp', language: 'English', locale: 'IN' }
    }
  },
  {
    name: 'Lottery Scam - Prize Winner',
    message: {
      sessionId: 'test-lottery-001',
      message: {
        sender: 'scammer',
        text: 'CONGRATULATIONS! Your mobile number has been selected for Rs.25 LAKH lottery prize! Pay Rs.5000 tax to claim. Contact: lottery@winner.tk',
        timestamp: Date.now()
      },
      conversationHistory: [],
      metadata: { channel: 'Email', language: 'English', locale: 'IN' }
    }
  },
  {
    name: 'Multi-turn Conversation',
    message: {
      sessionId: 'test-multiturn-001',
      message: {
        sender: 'scammer',
        text: 'Send the amount to my UPI: fraudster@ybl and share screenshot for confirmation.',
        timestamp: Date.now()
      },
      conversationHistory: [
        {
          sender: 'scammer',
          text: 'This is your bank manager. Your account needs urgent verification.',
          timestamp: Date.now() - 60000
        },
        {
          sender: 'user',
          text: 'Oh really? What do I need to do?',
          timestamp: Date.now() - 30000
        }
      ],
      metadata: { channel: 'WhatsApp', language: 'English', locale: 'IN' }
    }
  },
  {
    name: 'Normal Message (Non-Scam)',
    message: {
      sessionId: 'test-normal-001',
      message: {
        sender: 'scammer',
        text: 'Hey! How are you doing? Long time no see. Want to catch up for coffee this weekend?',
        timestamp: Date.now()
      },
      conversationHistory: [],
      metadata: { channel: 'WhatsApp', language: 'English', locale: 'IN' }
    }
  }
];

// HTTP request helper
function makeRequest(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await makeRequest('/health', 'GET');
    if (response.status === 200 && response.data.status === 'healthy') {
      console.log('✅ Health check passed');
      console.log(`   Uptime: ${response.data.uptime}s`);
      return true;
    } else {
      console.log('❌ Health check failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test without API key
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/honeypot',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      });
      req.on('error', reject);
      req.write(JSON.stringify({ sessionId: 'test', message: { text: 'test' } }));
      req.end();
    });
    
    if (response.status === 401) {
      console.log('✅ Missing API key correctly rejected (401)');
    } else {
      console.log('❌ Expected 401 for missing API key, got:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
    return false;
  }

  // Test with valid API key
  try {
    const response = await makeRequest('/api/honeypot', 'POST', {
      sessionId: 'auth-test',
      message: { sender: 'scammer', text: 'Test message', timestamp: Date.now() }
    });
    
    if (response.status === 200) {
      console.log('✅ Valid API key accepted');
      return true;
    } else {
      console.log('❌ Valid API key rejected:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
    return false;
  }
}

async function testScenarios() {
  console.log('\n🧪 Testing Scam Detection Scenarios...\n');
  
  let passed = 0;
  let failed = 0;

  for (const scenario of TEST_SCENARIOS) {
    console.log(`📝 ${scenario.name}`);
    console.log(`   Input: "${scenario.message.message.text.substring(0, 60)}..."`);
    
    try {
      const startTime = Date.now();
      const response = await makeRequest('/api/honeypot', 'POST', scenario.message);
      const latency = Date.now() - startTime;
      
      if (response.status === 200 && response.data.status === 'success') {
        console.log(`   ✅ Response: "${response.data.reply.substring(0, 60)}..."`);
        console.log(`   ⏱️  Latency: ${latency}ms`);
        passed++;
      } else {
        console.log(`   ❌ Failed:`, response.data);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
      failed++;
    }
    console.log('');
  }

  console.log(`\n📊 Results: ${passed}/${TEST_SCENARIOS.length} passed, ${failed} failed`);
  return failed === 0;
}

async function testResponseFormat() {
  console.log('\n📋 Testing Response Format...');
  
  const response = await makeRequest('/api/honeypot', 'POST', {
    sessionId: 'format-test',
    message: {
      sender: 'scammer',
      text: 'Your account is blocked. Verify now!',
      timestamp: Date.now()
    },
    conversationHistory: []
  });

  const checks = [
    { name: 'Has status field', pass: response.data.hasOwnProperty('status') },
    { name: 'Status is "success"', pass: response.data.status === 'success' },
    { name: 'Has reply field', pass: response.data.hasOwnProperty('reply') },
    { name: 'Reply is non-empty string', pass: typeof response.data.reply === 'string' && response.data.reply.length > 0 }
  ];

  let allPassed = true;
  for (const check of checks) {
    console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    if (!check.pass) allPassed = false;
  }

  return allPassed;
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       🍯 Agentic Honey-Pot API Test Suite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n🔧 Configuration:`);
  console.log(`   API URL: ${API_URL}`);
  console.log(`   API Key: ${API_KEY.substring(0, 8)}...`);

  const results = {
    health: await testHealthCheck(),
    auth: await testAuthentication(),
    format: await testResponseFormat(),
    scenarios: await testScenarios()
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    📊 Final Results');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Health Check:     ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Authentication:   ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Response Format:  ${results.format ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Scam Scenarios:   ${results.scenarios ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Deploy to a public URL (Railway, Render, Heroku, etc.)');
  console.log('   2. Update API_KEY in production environment');
  console.log('   3. Submit your URL and API key to GUVI');
  console.log('   4. Good luck! 🍀\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
