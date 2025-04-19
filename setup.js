// Setup script for Fault Code Analyzer
const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');

// Create an interface to read from stdin/stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Fault Code Analyzer Setup ===');
console.log('This script will help you configure the application to use a fault code API\n');

// Check for existing .env file
const envExists = fs.existsSync('.env');

// Load existing .env content if it exists
let envContent = '';
if (envExists) {
  envContent = fs.readFileSync('.env', 'utf8');
  console.log('Found existing .env file.');
}

// Parse existing values if present
const existingValues = {};
if (envContent) {
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        existingValues[key.trim()] = value.trim();
      }
    }
  });
}

// Get API URL
rl.question(`Enter fault code API URL [${existingValues.FAULT_CODE_API_URL || 'https://api.faultcodes.example.com/v1'}]: `, (apiUrl) => {
  const FAULT_CODE_API_URL = apiUrl || existingValues.FAULT_CODE_API_URL || 'https://api.faultcodes.example.com/v1';
  
  // Get API Key
  rl.question('Enter your fault code API key: ', (apiKey) => {
    const FAULT_CODE_API_KEY = apiKey || existingValues.FAULT_CODE_API_KEY || '';
    
    // Get admin username
    rl.question(`Admin username [${existingValues.ADMIN_USERNAME || 'Admin'}]: `, (adminUser) => {
      const ADMIN_USERNAME = adminUser || existingValues.ADMIN_USERNAME || 'Admin';
      
      // Get admin password
      rl.question(`Admin password [${existingValues.ADMIN_PASSWORD || 'Root64'}]: `, (adminPass) => {
        const ADMIN_PASSWORD = adminPass || existingValues.ADMIN_PASSWORD || 'Root64';
        
        // Get server port
        rl.question(`Server port [${existingValues.PORT || '10000'}]: `, (port) => {
          const PORT = port || existingValues.PORT || '10000';
          
          // Create or update .env file
          const envData = `# Server configuration
PORT=${PORT}

# API configuration for fault code lookup
FAULT_CODE_API_URL=${FAULT_CODE_API_URL}
FAULT_CODE_API_KEY=${FAULT_CODE_API_KEY}

# Admin credentials
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Created/updated on ${new Date().toISOString()}
`;
          
          fs.writeFileSync('.env', envData);
          console.log('\n.env file has been created/updated successfully!');
          
          // Create a gitignore file if it doesn't exist
          if (!fs.existsSync('.gitignore')) {
            fs.writeFileSync('.gitignore', `# Dependency directories
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS specific files
.DS_Store
Thumbs.db

# Logs
logs
*.log
`);
            console.log('.gitignore file has been created to protect your sensitive information');
          } else if (!fs.readFileSync('.gitignore', 'utf8').includes('.env')) {
            // Make sure .env is in gitignore
            fs.appendFileSync('.gitignore', '\n# Environment variables\n.env\n');
            console.log('Added .env to .gitignore to protect your API key');
          }
          
          console.log('\nSetup complete!');
          console.log('To start the application, run:');
          console.log('  npm run dev');
          console.log('\nMake sure to update your fault code API key if you need to.');
          
          console.log('\nWould you like to install dependencies and start the application now?');
          rl.question('Install and start? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
              console.log('\nInstalling dependencies...');
              exec('npm install', (error, stdout, stderr) => {
                if (error) {
                  console.error(`Error installing dependencies: ${error.message}`);
                  rl.close();
                  return;
                }
                console.log('Dependencies installed successfully!');
                console.log('\nStarting application...');
                
                // Start the application
                const child = exec('npm run dev');
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
                
                console.log('\nPress Ctrl+C to stop the application');
              });
            } else {
              console.log('\nYou can start the application later by running: npm run dev');
              rl.close();
            }
          });
        });
      });
    });
  });
}); 