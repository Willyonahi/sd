require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Local database of common fault codes
const faultCodeDatabase = {
  // Automotive fault codes
  'P0300': {
    description: 'Random/Multiple Cylinder Misfire Detected',
    causes: [
      'Faulty spark plugs or spark plug wires',
      'Bad ignition coils',
      'Clogged fuel injectors',
      'Low fuel pressure',
      'Vacuum leak',
      'Exhaust gas recirculation (EGR) valve problems'
    ],
    solutions: [
      'Check and replace spark plugs if necessary',
      'Inspect ignition coils and replace if faulty',
      'Clean or replace clogged fuel injectors',
      'Check fuel pressure and repair if low',
      'Inspect for vacuum leaks and repair',
      'Test and replace EGR valve if needed'
    ],
    safety: 'Ensure engine is cool before working. Disconnect battery before replacing electrical components.'
  },
  'P0171': {
    description: 'System Too Lean (Bank 1)',
    causes: [
      'Vacuum leak',
      'Faulty mass airflow sensor',
      'Clogged fuel injectors',
      'Low fuel pressure',
      'Exhaust leak before oxygen sensor'
    ],
    solutions: [
      'Check for vacuum leaks and repair',
      'Test and replace mass airflow sensor if faulty',
      'Clean or replace clogged fuel injectors',
      'Check fuel pressure and repair if low',
      'Inspect for exhaust leaks and repair'
    ],
    safety: 'Ensure engine is cool before working. Be careful when checking for exhaust leaks as components may be hot.'
  },
  'P0420': {
    description: 'Catalyst System Efficiency Below Threshold',
    causes: [
      'Faulty catalytic converter',
      'Oxygen sensor problems',
      'Exhaust leak',
      'Engine misfire',
      'Rich fuel mixture'
    ],
    solutions: [
      'Replace catalytic converter if faulty',
      'Test and replace oxygen sensors if needed',
      'Repair exhaust leaks',
      'Fix engine misfire issues',
      'Address rich fuel mixture problems'
    ],
    safety: 'Catalytic converters can be extremely hot. Allow engine to cool completely before inspection.'
  },
  
  // Aircraft fault codes
  'EGR': {
    description: 'Engine Ground Run Fault',
    causes: [
      'Abnormal engine parameters during ground run',
      'Fuel system issues',
      'Ignition system problems',
      'Sensor malfunctions'
    ],
    solutions: [
      'Check engine parameters and compare with normal ranges',
      'Inspect fuel system for leaks or blockages',
      'Test ignition system components',
      'Calibrate or replace faulty sensors'
    ],
    safety: 'Follow aircraft maintenance manual procedures. Ensure aircraft is properly secured during maintenance.'
  },
  'APU': {
    description: 'Auxiliary Power Unit Fault',
    causes: [
      'APU failure to start',
      'Abnormal APU parameters',
      'Fuel system issues',
      'Electrical system problems'
    ],
    solutions: [
      'Check APU start sequence and components',
      'Monitor APU parameters during operation',
      'Inspect APU fuel system',
      'Test APU electrical connections and components'
    ],
    safety: 'APU exhaust can be extremely hot. Maintain safe distance during operation. Follow aircraft-specific procedures.'
  },
  
  // Industrial equipment fault codes
  'E01': {
    description: 'Motor Overload',
    causes: [
      'Excessive load on motor',
      'Mechanical binding',
      'Low voltage',
      'Faulty motor'
    ],
    solutions: [
      'Reduce load on motor',
      'Check for mechanical binding and repair',
      'Verify voltage supply',
      'Test motor and replace if faulty'
    ],
    safety: 'Ensure power is disconnected before working on electrical components. Lock out/tag out procedures may be required.'
  },
  'E02': {
    description: 'Sensor Failure',
    causes: [
      'Disconnected sensor',
      'Faulty sensor',
      'Wiring problems',
      'Sensor calibration issues'
    ],
    solutions: [
      'Check sensor connections',
      'Test and replace faulty sensor',
      'Inspect and repair wiring',
      'Recalibrate sensor if possible'
    ],
    safety: 'Follow equipment-specific safety procedures. Some sensors may be in hazardous locations.'
  },
  
  // Technology equipment fault codes
  'E04': {
    description: 'Paper Jam',
    causes: [
      'Paper stuck in feed rollers',
      'Worn or dirty rollers',
      'Incorrect paper size or type',
      'Obstruction in paper path',
      'Misaligned paper guides'
    ],
    solutions: [
      'Clear paper from feed rollers and paper path',
      'Clean or replace worn rollers',
      'Use correct paper size and type',
      'Remove any obstructions',
      'Adjust paper guides to correct position'
    ],
    safety: 'Turn off device before clearing jams. Be careful with moving parts. Avoid using sharp objects to clear jams.'
  },
  'E05': {
    description: 'Toner/Ink Low',
    causes: [
      'Toner/ink cartridge nearly empty',
      'Faulty toner/ink level sensor',
      'Toner/ink cartridge not properly installed'
    ],
    solutions: [
      'Replace toner/ink cartridge',
      'Check and replace faulty sensor',
      'Remove and reinstall cartridge properly'
    ],
    safety: 'Handle toner/ink cartridges carefully. Avoid shaking or dropping. Dispose of used cartridges according to local regulations.'
  },
  'E06': {
    description: 'Scanner Error',
    causes: [
      'Scanner mechanism obstruction',
      'Faulty scanner motor',
      'Dirty scanner glass',
      'Scanner calibration issue'
    ],
    solutions: [
      'Clear any obstructions from scanner path',
      'Check and replace scanner motor if faulty',
      'Clean scanner glass with appropriate cleaner',
      'Run scanner calibration procedure'
    ],
    safety: 'Unplug device before cleaning. Use only manufacturer-recommended cleaning solutions.'
  },
  'E07': {
    description: 'Network Connection Error',
    causes: [
      'Network cable disconnected',
      'Incorrect network settings',
      'Firewall blocking connection',
      'IP address conflict',
      'Network driver issues'
    ],
    solutions: [
      'Check and reconnect network cable',
      'Verify network settings',
      'Configure firewall to allow device',
      'Resolve IP address conflict',
      'Update or reinstall network drivers'
    ],
    safety: 'No specific safety concerns for network troubleshooting.'
  },
  'E08': {
    description: 'Hardware Failure',
    causes: [
      'Failed component',
      'Overheating',
      'Power supply issues',
      'Firmware corruption'
    ],
    solutions: [
      'Identify and replace failed component',
      'Clean vents and ensure proper ventilation',
      'Check power supply and connections',
      'Update or reinstall firmware'
    ],
    safety: 'Disconnect power before opening device. Be aware of capacitors that may retain charge.'
  }
};

// Simulated AI responses for unknown fault codes
const simulatedAIResponses = {
  // Automotive simulated responses
  'P': {
    prefix: 'P',
    description: 'Powertrain fault code',
    commonCauses: [
      'Engine management system issues',
      'Transmission problems',
      'Fuel system faults',
      'Emission control system malfunctions'
    ],
    commonSolutions: [
      'Check engine management system',
      'Inspect transmission components',
      'Verify fuel system operation',
      'Test emission control systems'
    ]
  },
  'C': {
    prefix: 'C',
    description: 'Chassis fault code',
    commonCauses: [
      'Brake system issues',
      'Steering system problems',
      'Suspension faults',
      'Wheel and tire issues'
    ],
    commonSolutions: [
      'Inspect brake system components',
      'Check steering system',
      'Verify suspension operation',
      'Examine wheels and tires'
    ]
  },
  'B': {
    prefix: 'B',
    description: 'Body fault code',
    commonCauses: [
      'Airbag system issues',
      'Seat belt problems',
      'Door and lock malfunctions',
      'Climate control system faults'
    ],
    commonSolutions: [
      'Check airbag system',
      'Inspect seat belt components',
      'Verify door and lock operation',
      'Test climate control system'
    ]
  },
  'U': {
    prefix: 'U',
    description: 'Network/Communication fault code',
    commonCauses: [
      'CAN bus communication issues',
      'Module communication problems',
      'Wiring harness faults',
      'Control module malfunctions'
    ],
    commonSolutions: [
      'Check CAN bus communication',
      'Test module communication',
      'Inspect wiring harness',
      'Verify control module operation'
    ]
  },
  
  // Aircraft simulated responses
  'A': {
    prefix: 'A',
    description: 'Aircraft system fault',
    commonCauses: [
      'Avionics system issues',
      'Flight control problems',
      'Hydraulic system faults',
      'Electrical system malfunctions'
    ],
    commonSolutions: [
      'Check avionics systems',
      'Inspect flight control components',
      'Verify hydraulic system operation',
      'Test electrical systems'
    ]
  },
  
  // Industrial equipment simulated responses
  'I': {
    prefix: 'I',
    description: 'Industrial equipment fault',
    commonCauses: [
      'Control system issues',
      'Mechanical system problems',
      'Hydraulic system faults',
      'Electrical system malfunctions'
    ],
    commonSolutions: [
      'Check control systems',
      'Inspect mechanical components',
      'Verify hydraulic system operation',
      'Test electrical systems'
    ]
  },
  
  // Technology equipment simulated responses
  'T': {
    prefix: 'T',
    description: 'Technology equipment fault code',
    commonCauses: [
      'Hardware malfunction',
      'Software/firmware issues',
      'Connectivity problems',
      'User interface errors',
      'Resource limitations'
    ],
    commonSolutions: [
      'Check hardware components',
      'Update software/firmware',
      'Verify network connections',
      'Reset device to factory settings',
      'Clear device memory/cache'
    ]
  }
};

// Function to generate a simulated AI response
function generateSimulatedAIResponse(equipment, code) {
  // Determine the category based on the first character of the code
  const category = code.charAt(0).toUpperCase();
  const categoryInfo = simulatedAIResponses[category] || {
    description: 'Unknown fault code category',
    commonCauses: [
      'System malfunction',
      'Component failure',
      'Sensor issues',
      'Control system problems'
    ],
    commonSolutions: [
      'Check system operation',
      'Inspect components',
      'Verify sensor functionality',
      'Test control systems'
    ]
  };
  
  // Generate a response based on the equipment and code
  const analysis = `
Fault Code Analysis for ${equipment} - Code: ${code}

Issue Description:
This appears to be a ${categoryInfo.description} related to ${equipment.toLowerCase()}. 
The specific code ${code} indicates a potential issue that requires attention.

Possible Causes:
${categoryInfo.commonCauses.map(cause => `- ${cause}`).join('\n')}
- Equipment-specific issues related to ${equipment.toLowerCase()}
- Environmental factors affecting system operation
- Wear and tear on components

Recommended Solutions:
${categoryInfo.commonSolutions.map(solution => `- ${solution}`).join('\n')}
- Consult the equipment's service manual for specific procedures
- Check for any recent maintenance issues that might be related
- Verify that all related systems are functioning properly

Safety Precautions:
- Always follow proper safety procedures when working on equipment
- Ensure power is disconnected before working on electrical components
- Use appropriate personal protective equipment
- Follow manufacturer-specific safety guidelines
- Refer to the equipment's safety manual for specific precautions

Note: This information is provided as a general guide. For accurate diagnosis and repair, please consult your equipment's service manual or a qualified technician.
  `;
  
  return analysis;
}

// Function to scrape fault code information from the web
async function scrapeFaultCodeInfo(code, equipment) {
  try {
    // Normalize the code for searching
    const searchCode = code.toUpperCase();
    
    // Determine the search query based on the equipment type
    let searchQuery = `${searchCode} fault code`;
    
    if (equipment.toLowerCase().includes('car') || 
        equipment.toLowerCase().includes('truck') || 
        equipment.toLowerCase().includes('vehicle') ||
        equipment.toLowerCase().includes('automotive')) {
      searchQuery = `${searchCode} automotive fault code`;
    } else if (equipment.toLowerCase().includes('aircraft') || 
               equipment.toLowerCase().includes('airplane') || 
               equipment.toLowerCase().includes('helicopter')) {
      searchQuery = `${searchCode} aircraft fault code`;
    } else if (equipment.toLowerCase().includes('industrial') || 
               equipment.toLowerCase().includes('machine') || 
               equipment.toLowerCase().includes('equipment')) {
      searchQuery = `${searchCode} industrial fault code`;
    } else if (equipment.toLowerCase().includes('printer') || 
               equipment.toLowerCase().includes('fax') || 
               equipment.toLowerCase().includes('copier') || 
               equipment.toLowerCase().includes('scanner') || 
               equipment.toLowerCase().includes('network') || 
               equipment.toLowerCase().includes('computer')) {
      searchQuery = `${searchCode} ${equipment} fault code`;
    }
    
    // Use a search engine to find relevant pages
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    // Make the request with a user agent to avoid being blocked
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Parse the HTML response
    const $ = cheerio.load(response.data);
    
    // Extract search results
    const searchResults = [];
    $('.g').each((i, element) => {
      const title = $(element).find('h3').text();
      const link = $(element).find('a').attr('href');
      if (title && link && !link.includes('google.com')) {
        searchResults.push({ title, link });
      }
    });
    
    // If we found search results, try to scrape the first one
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      
      // Make a request to the first result
      const pageResponse = await axios.get(firstResult.link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Parse the HTML response
      const page$ = cheerio.load(pageResponse.data);
      
      // Extract relevant information
      let description = '';
      let causes = [];
      let solutions = [];
      
      // Look for paragraphs that might contain the description
      page$('p').each((i, element) => {
        const text = page$(element).text().trim();
        if (text.includes(searchCode) && !description) {
          description = text;
        }
      });
      
      // Look for lists that might contain causes or solutions
      page$('ul, ol').each((i, element) => {
        const items = [];
        page$(element).find('li').each((j, li) => {
          items.push(page$(li).text().trim());
        });
        
        if (items.length > 0) {
          if (items.some(item => item.toLowerCase().includes('cause') || 
                              item.toLowerCase().includes('problem') || 
                              item.toLowerCase().includes('issue'))) {
            causes = items;
          } else if (items.some(item => item.toLowerCase().includes('fix') || 
                                   item.toLowerCase().includes('solution') || 
                                   item.toLowerCase().includes('repair'))) {
            solutions = items;
          }
        }
      });
      
      // If we found some information, return it
      if (description || causes.length > 0 || solutions.length > 0) {
        return {
          description: description || `Fault code ${searchCode} for ${equipment}`,
          causes: causes.length > 0 ? causes : ['Information not available'],
          solutions: solutions.length > 0 ? solutions : ['Information not available'],
          source: firstResult.link
        };
      }
    }
    
    // If we couldn't find specific information, return null
    return null;
  } catch (error) {
    console.error('Error scraping fault code information:', error);
    return null;
  }
}

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    localDatabase: true
  });
});

// API endpoint for fault code analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { equipment, code } = req.body;
    
    if (!equipment || !code) {
      return res.status(400).json({ error: 'Equipment and code are required' });
    }

    // Normalize the code to uppercase for case-insensitive matching
    const normalizedCode = code.toUpperCase();
    
    // First check if we have the code in our database
    if (faultCodeDatabase[normalizedCode]) {
      const faultInfo = faultCodeDatabase[normalizedCode];
      
      // Format the response
      const analysis = `
Issue Description:
${faultInfo.description}

Possible Causes:
${faultInfo.causes.map(cause => `- ${cause}`).join('\n')}

Recommended Solutions:
${faultInfo.solutions.map(solution => `- ${solution}`).join('\n')}

Safety Precautions:
${faultInfo.safety}

Note: This information is provided as a general guide. Always consult your equipment's service manual for specific procedures.
      `;
      
      res.json({ analysis });
    } else {
      // Simulate a delay to make it seem like we're processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to scrape information from the web
      const scrapedInfo = await scrapeFaultCodeInfo(code, equipment);
      
      if (scrapedInfo) {
        // Format the scraped information
        const analysis = `
Fault Code Analysis for ${equipment} - Code: ${code}

Issue Description:
${scrapedInfo.description}

Possible Causes:
${scrapedInfo.causes.map(cause => `- ${cause}`).join('\n')}

Recommended Solutions:
${scrapedInfo.solutions.map(solution => `- ${solution}`).join('\n')}

Safety Precautions:
- Always follow proper safety procedures when working on equipment
- Ensure power is disconnected before working on electrical components
- Use appropriate personal protective equipment
- Follow manufacturer-specific safety guidelines

Source: ${scrapedInfo.source}

Note: This information is provided as a general guide. For accurate diagnosis and repair, please consult your equipment's service manual or a qualified technician.
        `;
        
        res.json({ analysis });
      } else {
        // If scraping failed, generate a simulated response
        const analysis = generateSimulatedAIResponse(equipment, code);
        res.json({ analysis });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze fault code',
      details: error.message
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log('Using local fault code database with web scraping for unknown codes');
}); 