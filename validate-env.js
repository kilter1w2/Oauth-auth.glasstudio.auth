#!/usr/bin/env node

/**
 * Environment Validation Script
 * Checks if all required environment variables are properly configured
 */

require('dotenv').config({ path: '.env.local' });

function validateEnv() {
  console.log('🔍 Validating Environment Configuration...\n');

  const required = {
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
  };

  const optional = {
    'JWT_SECRET': process.env.JWT_SECRET,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
    'ENCRYPTION_KEY': process.env.ENCRYPTION_KEY,
  };

  let hasErrors = false;

  console.log('📋 Required Variables:');
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      console.log(`❌ ${key}: MISSING`);
      hasErrors = true;
    } else if (key === 'FIREBASE_PRIVATE_KEY') {
      if (value.includes('YOUR_PRIVATE_KEY')) {
        console.log(`❌ ${key}: PLACEHOLDER (needs real private key)`);
        hasErrors = true;
      } else if (!value.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log(`❌ ${key}: INVALID FORMAT (not a PEM key)`);
        hasErrors = true;
      } else {
        console.log(`✅ ${key}: CONFIGURED`);
      }
    } else {
      console.log(`✅ ${key}: CONFIGURED`);
    }
  }

  console.log('\n📋 Optional Variables:');
  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      console.log(`⚠️  ${key}: NOT SET (recommended)`);
    } else if (value.includes('your-') || value.includes('replace-')) {
      console.log(`⚠️  ${key}: PLACEHOLDER (should be changed)`);
    } else {
      console.log(`✅ ${key}: CONFIGURED`);
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ CONFIGURATION ERRORS FOUND');
    console.log('\n🔧 To fix Firebase issues:');
    console.log('   1. Run: node setup-firebase.js');
    console.log('   2. Or manually update .env.local with real Firebase credentials');
    console.log('\n📚 See API_USAGE_GUIDE.md for detailed instructions');
  } else {
    console.log('✅ ALL REQUIRED VARIABLES CONFIGURED');
    console.log('\n🚀 Your Firebase Admin SDK should work now!');
    console.log('   Restart your dev server: npm run dev');
  }
}

validateEnv();
