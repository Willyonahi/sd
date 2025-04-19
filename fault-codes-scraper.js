const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Create a delay function to avoid rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Define manufacturers from the website
const manufacturers = [
  'acura', 'alfa-romeo', 'audi', 'bmw', 'buick', 'cadillac', 'chevrolet', 
  'chrysler', 'citroen', 'dacia', 'dodge', 'fiat', 'ford', 'gmc', 'honda', 
  'hyundai', 'infiniti', 'jaguar', 'jeep', 'kia', 'land-rover', 'lexus', 
  'lincoln', 'mazda', 'mercedes-benz', 'mercury', 'mini', 'mitsubishi', 
  'nissan', 'opel', 'peugeot', 'pontiac', 'porsche', 'renault', 'saab', 
  'seat', 'skoda', 'subaru', 'suzuki', 'toyota', 'volkswagen', 'volvo'
];

// Common fault code prefixes
const codeTypes = ['P', 'B', 'C', 'U'];

// Database to store all fault codes information
const faultCodeDatabase = {};

// Function to scrape models for a manufacturer
async function getModelsForManufacturer(manufacturer) {
  try {
    console.log(`Fetching models for ${manufacturer}...`);
    const url = `https://faultcodes.co/cars/${manufacturer}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const models = [];
    
    // Look for model links
    $('.car-model-card a').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        const modelPath = href.split('/').pop();
        if (modelPath) {
          models.push(modelPath);
        }
      }
    });
    
    return models;
  } catch (error) {
    console.error(`Error fetching models for ${manufacturer}:`, error.message);
    return [];
  }
}

// Function to scrape fault codes for a specific model
async function getFaultCodesForModel(manufacturer, model) {
  try {
    console.log(`Fetching fault codes for ${manufacturer} ${model}...`);
    const url = `https://faultcodes.co/cars/${manufacturer}/${model}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const faultCodes = [];
    
    // Look for fault code links
    $('.fault-code-card a').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        const code = href.split('/').pop().toUpperCase();
        if (code) {
          faultCodes.push(code);
        }
      }
    });
    
    return faultCodes;
  } catch (error) {
    console.error(`Error fetching fault codes for ${manufacturer} ${model}:`, error.message);
    return [];
  }
}

// Function to get generic fault codes (not model specific)
async function getGenericFaultCodes() {
  const allCodes = [];
  
  // Generate common OBD codes
  for (const type of codeTypes) {
    for (let i = 0; i <= 9999; i++) {
      const code = `${type}${i.toString().padStart(4, '0')}`;
      allCodes.push(code);
    }
  }
  
  // Also try to get the most popular codes from the site
  try {
    console.log('Fetching popular fault codes from the site...');
    const url = 'https://faultcodes.co/';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for popular code links
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('/code/')) {
        const code = href.split('/').pop().toUpperCase();
        if (code && !allCodes.includes(code)) {
          allCodes.push(code);
        }
      }
    });
  } catch (error) {
    console.error('Error fetching popular fault codes:', error.message);
  }
  
  return allCodes;
}

// Function to get fault code details
async function getFaultCodeDetails(code, manufacturer = null, model = null) {
  try {
    let url;
    if (manufacturer && model) {
      url = `https://faultcodes.co/cars/${manufacturer}/${model}/${code.toLowerCase()}`;
    } else if (manufacturer) {
      url = `https://faultcodes.co/cars/${manufacturer}/${code.toLowerCase()}`;
    } else {
      url = `https://faultcodes.co/code/${code.toLowerCase()}`;
    }
    
    console.log(`Fetching details for ${code} (${url})...`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract description
    const description = $('.fault-description h1, .fault-description h2').first().text().trim();
    
    // Extract causes
    const causes = [];
    $('.fault-causes ul li').each((i, element) => {
      causes.push($(element).text().trim());
    });
    
    // Extract solutions
    const solutions = [];
    $('.fault-solutions ul li').each((i, element) => {
      solutions.push($(element).text().trim());
    });
    
    // Extract severity
    const severity = $('.severity-level').text().trim();
    
    return {
      code,
      manufacturer: manufacturer || 'generic',
      model: model || 'all',
      description: description || `Fault code ${code}`,
      causes: causes.length > 0 ? causes : ['Information not available'],
      solutions: solutions.length > 0 ? solutions : ['Information not available'],
      severity: severity || 'Not specified'
    };
  } catch (error) {
    console.error(`Error fetching details for ${code}:`, error.message);
    return null;
  }
}

// Main function to scrape all fault codes
async function scrapeAllFaultCodes() {
  const outputDir = path.join(__dirname, 'fault-codes-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get generic fault codes first
  const genericCodes = await getGenericFaultCodes();
  console.log(`Found ${genericCodes.length} generic fault codes`);
  
  // Process a subset of generic codes to avoid overloading
  const sampleGenericCodes = genericCodes.slice(0, 100); // Limit to first 100 for testing
  for (const code of sampleGenericCodes) {
    await delay(500); // Add delay to avoid rate limiting
    const details = await getFaultCodeDetails(code);
    if (details) {
      faultCodeDatabase[code] = details;
      // Save progress periodically
      if (Object.keys(faultCodeDatabase).length % 10 === 0) {
        fs.writeFileSync(
          path.join(outputDir, 'fault-codes-progress.json'),
          JSON.stringify(faultCodeDatabase, null, 2)
        );
      }
    }
  }
  
  // Process manufacturer-specific codes
  for (const manufacturer of manufacturers) {
    // Get all models for this manufacturer
    const models = await getModelsForManufacturer(manufacturer);
    console.log(`Found ${models.length} models for ${manufacturer}`);
    
    // Process a subset of models to avoid overloading
    const sampleModels = models.slice(0, 3); // Limit to first 3 models for testing
    for (const model of sampleModels) {
      // Get fault codes for this model
      await delay(500);
      const faultCodes = await getFaultCodesForModel(manufacturer, model);
      console.log(`Found ${faultCodes.length} fault codes for ${manufacturer} ${model}`);
      
      // Process a subset of fault codes to avoid overloading
      const sampleFaultCodes = faultCodes.slice(0, 5); // Limit to first 5 codes per model
      for (const code of sampleFaultCodes) {
        await delay(500);
        const details = await getFaultCodeDetails(code, manufacturer, model);
        if (details) {
          // Use a composite key to handle the same code for different manufacturers/models
          const key = `${code}_${manufacturer}_${model}`;
          faultCodeDatabase[key] = details;
          
          // Save progress periodically
          if (Object.keys(faultCodeDatabase).length % 10 === 0) {
            fs.writeFileSync(
              path.join(outputDir, 'fault-codes-progress.json'),
              JSON.stringify(faultCodeDatabase, null, 2)
            );
          }
        }
      }
    }
  }
  
  // Save final results
  fs.writeFileSync(
    path.join(outputDir, 'fault-codes-database.json'),
    JSON.stringify(faultCodeDatabase, null, 2)
  );
  
  console.log('Scraping completed! Total fault codes collected:', Object.keys(faultCodeDatabase).length);
}

// Warning about the script's operation
console.log(`
WARNING: This script will attempt to download many fault codes from FaultCodes.co
The full scrape could take hours and make thousands of requests to the website.
This is set up with sampling to limit the number of requests for testing purposes.
To do a full scrape, modify the sample sizes in the code.

To start scraping, we recommend:
1. Installing required dependencies: npm install axios cheerio
2. Running the script: node fault-codes-scraper.js

Press Ctrl+C to cancel at any time.
`);

// Uncomment to run the scraper
// scrapeAllFaultCodes().catch(console.error);

// Export for potential use as a module
module.exports = {
  scrapeAllFaultCodes,
  getModelsForManufacturer,
  getFaultCodesForModel,
  getFaultCodeDetails
}; 