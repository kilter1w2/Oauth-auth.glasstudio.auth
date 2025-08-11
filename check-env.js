#!/usr/bin/env node

/**
 * Environment Configuration Checker for GLAStudio OAuth
 *
 * This script validates that all required environment variables are properly configured.
 * Run with: node check-env.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Environment variable configuration
const envConfig = {
  required: [
    {
      key: 'NEXT_PUBLIC_FIREBASE_API_KEY',
      description: 'Firebase Web API Key',
      category: 'Firebase Client'
    },
    {
      key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      description: 'Firebase Auth Domain',
      category: 'Firebase Client'
    },
    {
      key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      description: 'Firebase Project ID',
      category: 'Firebase Client'
    },
    {
      key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      description: 'Firebase Storage Bucket',
      category: 'Firebase Client'
    },
    {
      key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      description: 'Firebase Messaging Sender ID',
      category: 'Firebase Client'
    },
    {
      key: 'NEXT_PUBLIC_FIREBASE_APP_ID',
      description: 'Firebase App ID',
      category: 'Firebase Client'
    }
  ],
  optional: [
    {
      key: 'FIREBASE_PROJECT_ID',
      description: 'Firebase Project ID (Server)',
      category: 'Firebase Admin'
    },
    {
      key: 'FIREBASE_CLIENT_EMAIL',
      description: 'Firebase Service Account Email',
      category: 'Firebase Admin'
    },
    {
      key: 'FIREBASE_PRIVATE_KEY',
      description: 'Firebase Private Key',
      category: 'Firebase Admin'
    },
    {
      key: 'SESSION_SECRET',
      description: 'Server Session Secret',
      category: 'Session Management'
    },
    {
      key: 'NEXT_PUBLIC_SESSION_SECRET',
      description: 'Client Session Secret',
      category: 'Session Management'
    },
    {
      key: 'OAUTH_CLIENT_ID',
      description: 'OAuth Client ID',
      category: 'OAuth'
    },
    {
      key: 'OAUTH_CLIENT_SECRET',
      description: 'OAuth Client Secret',
      category: 'OAuth'
    }
  ]
};

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    return { exists: false, vars: {} };
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const vars = {};

    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim().replace(/^["'](.*)["']$/, '$1');
        }
      }
    });

    return { exists: true, vars };
  } catch (error) {
    return { exists: true, vars: {}, error: error.message };
  }
}

// Check individual environment variable
function checkEnvVar(envVar, envVars) {
  const value = process.env[envVar.key] || envVars[envVar.key];
  const status = {
    key: envVar.key,
    value: value,
    exists: !!value,
    description: envVar.description,
    category: envVar.category,
    required: true
  };

  return status;
}

// Print status icon
function getStatusIcon(exists, required = true) {
  if (exists) {
    return `${colors.green}✓${colors.reset}`;
  } else if (required) {
    return `${colors.red}✗${colors.reset}`;
  } else {
    return `${colors.yellow}⚠${colors.reset}`;
  }
}

// Print section header
function printSectionHeader(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

// Print environment variable status
function printEnvStatus(status, required = true) {
  const icon = getStatusIcon(status.exists, required);
  const statusText = status.exists ?
    `${colors.green}Set${colors.reset}` :
    required ? `${colors.red}Missing${colors.reset}` : `${colors.yellow}Not Set${colors.reset}`;

  const maskedValue = status.value ?
    (status.key.includes('SECRET') || status.key.includes('PRIVATE_KEY') ?
      `${status.value.substring(0, 8)}...` : status.value) :
    'Not set';

  console.log(`${icon} ${status.key.padEnd(40)} ${statusText.padEnd(20)} ${colors.magenta}${maskedValue}${colors.reset}`);
  console.log(`   ${colors.white}${status.description}${colors.reset}`);
}

// Main check function
function checkEnvironment() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                GLAStudio OAuth Environment Checker           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  // Load .env.local file
  const envFile = loadEnvFile();

  if (!envFile.exists) {
    console.log(`${colors.yellow}⚠ Warning: .env.local file not found${colors.reset}`);
    console.log(`${colors.white}  Create a .env.local file in your project root with your configuration${colors.reset}\n`);
  } else if (envFile.error) {
    console.log(`${colors.red}✗ Error loading .env.local: ${envFile.error}${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ .env.local file found and loaded${colors.reset}\n`);
  }

  let errors = 0;
  let warnings = 0;

  // Check required variables
  printSectionHeader('Required Configuration (Firebase Client)');
  envConfig.required.forEach(envVar => {
    const status = checkEnvVar(envVar, envFile.vars || {});
    printEnvStatus(status, true);
    if (!status.exists) errors++;
  });

  // Check optional variables
  printSectionHeader('Optional Configuration');
  envConfig.optional.forEach(envVar => {
    const status = checkEnvVar(envVar, envFile.vars || {});
    printEnvStatus(status, false);
    if (!status.exists) warnings++;
  });

  // Print summary
  printSectionHeader('Summary');

  if (errors === 0) {
    console.log(`${colors.green}✓ Configuration is valid! All required variables are set.${colors.reset}`);

    if (warnings > 0) {
      console.log(`${colors.yellow}⚠ ${warnings} optional variables are not set. Some features may be limited.${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.green}🎉 Your OAuth system is ready to go!${colors.reset}`);
    console.log(`${colors.white}Start development server: ${colors.cyan}npm run dev${colors.reset}`);
    console.log(`${colors.white}Visit: ${colors.cyan}http://localhost:3000${colors.reset}`);

  } else {
    console.log(`${colors.red}✗ Configuration has ${errors} error(s) that need to be fixed.${colors.reset}`);

    console.log(`\n${colors.bold}${colors.red}🚨 Setup Required${colors.reset}`);
    console.log(`${colors.white}1. Create .env.local file in project root${colors.reset}`);
    console.log(`${colors.white}2. Add missing Firebase configuration variables${colors.reset}`);
    console.log(`${colors.white}3. Get Firebase config from: ${colors.cyan}https://console.firebase.google.com/${colors.reset}`);
    console.log(`${colors.white}4. Run this script again: ${colors.cyan}node check-env.js${colors.reset}`);

    console.log(`\n${colors.yellow}📖 Need help? Visit: ${colors.cyan}http://localhost:3000/setup${colors.reset}`);
    console.log(`${colors.yellow}📚 Full guide: ${colors.cyan}FIREBASE_SETUP.md${colors.reset}`);
  }

  // Print quick setup template
  if (errors > 0) {
    printSectionHeader('Environment File Template');
    console.log(`${colors.white}Create ${colors.cyan}.env.local${colors.white} with:${colors.reset}\n`);

    console.log(`${colors.magenta}# Firebase Client Configuration${colors.reset}`);
    envConfig.required.forEach(envVar => {
      console.log(`${colors.cyan}${envVar.key}${colors.reset}=${colors.yellow}your_${envVar.key.toLowerCase()}_value${colors.reset}`);
    });

    console.log(`\n${colors.magenta}# Optional Configuration${colors.reset}`);
    envConfig.optional.slice(0, 2).forEach(envVar => {
      console.log(`${colors.cyan}${envVar.key}${colors.reset}=${colors.yellow}your_${envVar.key.toLowerCase()}_value${colors.reset}`);
    });
  }

  console.log('\n');
  process.exit(errors > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bold}GLAStudio OAuth Environment Checker${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node check-env.js              Check environment configuration
  node check-env.js --help       Show this help message

${colors.cyan}Description:${colors.reset}
  Validates that all required environment variables are properly configured
  for the GLAStudio OAuth authentication system.

${colors.cyan}Exit codes:${colors.reset}
  0  All required variables are set
  1  Missing required variables

${colors.cyan}Examples:${colors.reset}
  node check-env.js              # Check configuration
  npm run check-env              # If added to package.json scripts
`);
  process.exit(0);
}

// Run the check
try {
  checkEnvironment();
} catch (error) {
  console.error(`${colors.red}Error running environment check: ${error.message}${colors.reset}`);
  process.exit(1);
}
