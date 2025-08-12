#!/usr/bin/env node

/**
 * Generate secure secrets for environment variables
 */

const crypto = require('crypto');

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function generateApiKey() {
  return 'gla_' + crypto.randomBytes(16).toString('hex');
}

function generateClientId() {
  return 'gla_' + crypto.randomBytes(8).toString('hex');
}

function generateClientSecret() {
  return 'gls_' + crypto.randomBytes(24).toString('hex');
}

console.log('🔐 Generated Secure Secrets for GLAStudio OAuth System');
console.log('=====================================================\n');

console.log('Copy these values to your .env.local file:\n');

console.log('# Security Secrets');
console.log(`JWT_SECRET=${generateSecureSecret(64)}`);
console.log(`NEXTAUTH_SECRET=${generateSecureSecret(32)}`);
console.log(`ENCRYPTION_KEY=${generateSecureSecret(32)}`);

console.log('\n# Example API Credentials (for testing)');
console.log(`EXAMPLE_CLIENT_ID=${generateClientId()}`);
console.log(`EXAMPLE_CLIENT_SECRET=${generateClientSecret()}`);
console.log(`EXAMPLE_API_KEY=${generateApiKey()}`);

console.log('\n✅ All secrets generated successfully!');
console.log('📝 Update your .env.local file with these values');
console.log('🔥 For Firebase: Run "node setup-firebase.js" with your service account JSON');
