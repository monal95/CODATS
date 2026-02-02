// CODATS Security Scanner - Test File
// This file contains various security vulnerabilities for testing purposes

// 1. eval() usage - VULNERABILITY
const userInput = "malicious code";
const result = eval(userInput);

// 2. Hardcoded API Key - VULNERABILITY
const API_KEY = "sk-1234567890abcdefghijklmn";
const API_SECRET = "secret-abc123xyz789";

// 3. SQL Injection - VULNERABILITY
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.query(query);
}

// 4. innerHTML XSS - VULNERABILITY
function displayUserName(name) {
  const elem = document.getElementById("user-name");
  elem.innerHTML = name; // User input directly to innerHTML
}

// 5. Weak Cryptography - VULNERABILITY
const crypto = require('crypto');
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// 6. Command Injection - VULNERABILITY
const child_process = require('child_process');
app.post('/execute', (req, res) => {
  const command = `ls -la ${req.query.dir}`;
  child_process.execSync(command);
  res.send('Command executed');
});

// 7. Disabled SSL Verification - VULNERABILITY
const https = require('https');
https.get('https://example.com', {
  rejectUnauthorized: false // SSL/TLS verification disabled!
}, (res) => {
  console.log(res);
});

// 8. Missing Authentication - VULNERABILITY
app.post('/update-profile', (req, res) => {
  // No authentication check!
  updateUserProfile(req.body);
  res.send('Profile updated');
});

// 9. Hardcoded Credentials - VULNERABILITY
const credentials = {
  username: 'admin',
  password: 'admin123'
};

// 10. Insecure Random - VULNERABILITY
function generateToken() {
  return Math.random().toString(36).substr(2, 9);
}

console.log('Testing CODATS vulnerability detection');
