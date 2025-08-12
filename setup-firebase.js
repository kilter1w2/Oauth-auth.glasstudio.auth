#!/usr/bin/env node

/**
 * Firebase Setup Script for GLAStudio OAuth System
 * 
 * This script helps you set up Firebase Admin SDK credentials properly.
 * Run: node setup-firebase.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔥 Firebase Admin SDK Setup for GLAStudio OAuth System');
  console.log('=====================================================\n');

  console.log('This script will help you configure Firebase Admin SDK credentials.');
  console.log('You need to have a Firebase service account JSON file ready.\n');

  console.log('Steps to get Firebase service account credentials:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project (or create one)');
  console.log('3. Go to Project Settings > Service Accounts');
  console.log('4. Click "Generate new private key"');
  console.log('5. Download the JSON file\n');

  const hasServiceAccount = await question('Do you have the service account JSON file? (y/n): ');
  
  if (hasServiceAccount.toLowerCase() !== 'y') {
    console.log('\nPlease get the service account JSON file first and run this script again.');
    rl.close();
    return;
  }

  const jsonPath = await question('Enter the path to your service account JSON file: ');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ File not found. Please check the path and try again.');
    rl.close();
    return;
  }

  try {
    // Read and parse the service account JSON
    const serviceAccountData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Validate required fields
    if (!serviceAccountData.project_id || !serviceAccountData.private_key || !serviceAccountData.client_email) {
      console.log('❌ Invalid service account JSON. Missing required fields.');
      rl.close();
      return;
    }

    // Read current .env.local file
    const envLocalPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
    } else {
      // Copy from .env.example if .env.local doesn't exist
      const envExamplePath = path.join(__dirname, '.env.example');
      if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
      }
    }

    // Update Firebase Admin SDK credentials
    envContent = envContent.replace(
      /FIREBASE_PROJECT_ID=.*/,
      `FIREBASE_PROJECT_ID=${serviceAccountData.project_id}`
    );
    
    envContent = envContent.replace(
      /FIREBASE_CLIENT_EMAIL=.*/,
      `FIREBASE_CLIENT_EMAIL=${serviceAccountData.client_email}`
    );
    
    // Properly escape the private key for .env file
    const escapedPrivateKey = serviceAccountData.private_key.replace(/\n/g, '\\n');
    envContent = envContent.replace(
      /FIREBASE_PRIVATE_KEY=.*/,
      `FIREBASE_PRIVATE_KEY="${escapedPrivateKey}"`
    );

    // Write updated .env.local file
    fs.writeFileSync(envLocalPath, envContent);

    console.log('\n✅ Firebase Admin SDK credentials updated successfully!');
    console.log('📁 Updated file: .env.local');
    console.log('\n🔧 Configuration applied:');
    console.log(`   Project ID: ${serviceAccountData.project_id}`);
    console.log(`   Client Email: ${serviceAccountData.client_email}`);
    console.log(`   Private Key: [CONFIGURED]`);
    
    console.log('\n🚀 You can now restart your development server.');
    console.log('   Run: npm run dev');

  } catch (error) {
    console.log('❌ Error processing service account JSON:', error.message);
  }

  rl.close();
}

main().catch(console.error);
