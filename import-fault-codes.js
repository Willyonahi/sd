const fs = require('fs');
const path = require('path');

// Path to the scraped fault codes database
const DATA_FILE = path.join(__dirname, 'fault-codes-data', 'fault-codes-database.json');

// Path to the server.js file
const SERVER_FILE = path.join(__dirname, 'server.js');

// Function to format fault code data for insertion into server.js
function formatFaultCodeForServerJs(faultCode) {
  const { code, description, causes, solutions, severity } = faultCode;
  
  // Format the causes array
  const causesStr = causes
    .map(cause => `      '${cause.replace(/'/g, "\\'")}'`)
    .join(',\n');
  
  // Format the solutions array
  const solutionsStr = solutions
    .map(solution => `      '${solution.replace(/'/g, "\\'")}'`)
    .join(',\n');
  
  // Safety information based on severity
  let safety;
  if (severity && severity.toLowerCase().includes('high')) {
    safety = 'This is a serious issue that requires immediate attention. Do not drive the vehicle until resolved.';
  } else if (severity && severity.toLowerCase().includes('medium')) {
    safety = 'This issue should be addressed soon. Limit driving until the problem is resolved.';
  } else {
    safety = 'Follow standard safety procedures when working on the vehicle. Disconnect the battery before working on electrical components.';
  }
  
  // Generate the formatted object
  return `  '${code}': {
    description: '${description.replace(/'/g, "\\'")}',
    causes: [
${causesStr}
    ],
    solutions: [
${solutionsStr}
    ],
    safety: '${safety.replace(/'/g, "\\'")}'
  }`;
}

// Function to import the fault codes into server.js
function importFaultCodesToServer() {
  try {
    // Check if the data file exists
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`Error: The file ${DATA_FILE} does not exist.`);
      console.log('Please run the fault-codes-scraper.js script first to gather data.');
      return;
    }
    
    // Read the fault codes data
    const faultCodesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    if (!faultCodesData || Object.keys(faultCodesData).length === 0) {
      console.error('Error: No fault codes found in the data file.');
      return;
    }
    
    // Read the server.js file
    const serverFileContent = fs.readFileSync(SERVER_FILE, 'utf8');
    
    // Find the faultCodeDatabase object in the server.js file
    const databaseStartMatch = serverFileContent.match(/const faultCodeDatabase = \{/);
    const databaseEndMatch = serverFileContent.match(/\};\s*\/\/ Simulated AI responses/);
    
    if (!databaseStartMatch || !databaseEndMatch) {
      console.error('Error: Could not locate the faultCodeDatabase object in server.js.');
      return;
    }
    
    const startIndex = databaseStartMatch.index + databaseStartMatch[0].length;
    const endIndex = databaseEndMatch.index;
    
    // Extract the existing database content
    const existingDatabaseContent = serverFileContent.substring(startIndex, endIndex);
    
    // Format each fault code for insertion
    const formattedFaultCodes = [];
    
    // Keep track of codes we've already processed
    const processedCodes = new Set();
    
    Object.values(faultCodesData).forEach(faultCode => {
      // Only process each unique code once (prioritize manufacturer-specific ones)
      if (!processedCodes.has(faultCode.code)) {
        formattedFaultCodes.push(formatFaultCodeForServerJs(faultCode));
        processedCodes.add(faultCode.code);
      }
    });
    
    if (formattedFaultCodes.length === 0) {
      console.error('Error: No valid fault codes to import.');
      return;
    }
    
    // Check if there are existing entries
    const hasExistingEntries = existingDatabaseContent.trim().length > 0;
    
    // Create the new database content
    let newDatabaseContent = hasExistingEntries
      ? `${existingDatabaseContent},\n\n  // Auto-imported fault codes from FaultCodes.co\n${formattedFaultCodes.join(',\n')}`
      : `\n  // Auto-imported fault codes from FaultCodes.co\n${formattedFaultCodes.join(',\n')}`;
    
    // Replace the database content in the server.js file
    const newServerFileContent = serverFileContent.substring(0, startIndex) +
      newDatabaseContent +
      serverFileContent.substring(endIndex);
    
    // Write the updated server.js file
    fs.writeFileSync(`${SERVER_FILE}.backup`, serverFileContent, 'utf8');
    fs.writeFileSync(SERVER_FILE, newServerFileContent, 'utf8');
    
    console.log(`Success! Imported ${formattedFaultCodes.length} fault codes into server.js.`);
    console.log(`A backup of the original file was saved as ${SERVER_FILE}.backup.`);
  } catch (error) {
    console.error('Error importing fault codes:', error);
  }
}

// Execute the import function
console.log('Starting import of fault codes to server.js...');
console.log('This script will:');
console.log('1. Read the scraped fault code data');
console.log('2. Format the fault codes for insertion into server.js');
console.log('3. Update the faultCodeDatabase in server.js');
console.log('4. Create a backup of the original server.js file');
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');

// Wait 5 seconds before executing
setTimeout(() => {
  importFaultCodesToServer();
}, 5000); 