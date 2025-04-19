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
  },
  
  // Additional OBD codes from specialized websites
  'P0301': {
    description: 'Cylinder 1 Misfire Detected',
    causes: [
      'Faulty spark plug or ignition coil in cylinder 1',
      'Fuel injector problem in cylinder 1',
      'Low compression in cylinder 1',
      'Vacuum leak near cylinder 1 intake port',
      'EGR valve leaking or stuck open',
      'Camshaft position sensor malfunction'
    ],
    solutions: [
      'Replace spark plug and/or ignition coil for cylinder 1',
      'Clean or replace fuel injector for cylinder 1',
      'Perform compression test and repair if necessary',
      'Check for and repair vacuum leaks',
      'Inspect and replace EGR valve if necessary',
      'Check and replace camshaft position sensor if defective'
    ],
    safety: 'Disconnect battery before working on ignition components. Ensure engine is cool before starting work.'
  },
  'P0302': {
    description: 'Cylinder 2 Misfire Detected',
    causes: [
      'Faulty spark plug or ignition coil in cylinder 2',
      'Fuel injector problem in cylinder 2',
      'Low compression in cylinder 2',
      'Vacuum leak near cylinder 2 intake port',
      'Camshaft timing issue',
      'Worn valve guides or seats'
    ],
    solutions: [
      'Replace spark plug and/or ignition coil for cylinder 2',
      'Clean or replace fuel injector for cylinder 2',
      'Perform compression test and repair if necessary',
      'Check for and repair vacuum leaks',
      'Verify camshaft timing and adjust if needed',
      'Inspect valves and repair if damaged'
    ],
    safety: 'Disconnect battery before working on ignition components. Follow proper torque specifications when reinstalling parts.'
  },
  'P0102': {
    description: 'Mass Air Flow (MAF) Sensor Circuit Low Input',
    causes: [
      'Dirty or contaminated MAF sensor',
      'Damaged MAF sensor wiring or connector',
      'Faulty MAF sensor',
      'Air intake leaks before MAF sensor',
      'Engine control module (ECM) failure',
      'Clogged air filter'
    ],
    solutions: [
      'Clean MAF sensor with specialized cleaner',
      'Inspect and repair damaged wiring or connectors',
      'Replace MAF sensor if faulty',
      'Check for and repair air intake leaks',
      'Verify ECM operation and update/replace if necessary',
      'Replace air filter if dirty'
    ],
    safety: 'Disconnect battery before working on electrical components. Use only designated MAF sensor cleaner to avoid damage.'
  },
  'P0128': {
    description: 'Coolant Temperature Below Thermostat Regulating Temperature',
    causes: [
      'Faulty thermostat (stuck open)',
      'Low coolant level',
      'Bad coolant temperature sensor',
      'Damaged cooling fan relay or control circuit',
      'Faulty water pump',
      'Engine control module (ECM) issues'
    ],
    solutions: [
      'Replace thermostat',
      'Check coolant level and add if needed',
      'Test and replace coolant temperature sensor if faulty',
      'Inspect cooling fan operation and repair as needed',
      'Check water pump function and replace if necessary',
      'Test ECM and update/replace if required'
    ],
    safety: 'Only work on a cool engine. Wear gloves when handling coolant as it is toxic. Properly dispose of used coolant.'
  },
  'P0401': {
    description: 'Exhaust Gas Recirculation (EGR) Flow Insufficient',
    causes: [
      'Clogged EGR passages or ports',
      'Faulty EGR valve',
      'Carbon buildup in EGR system',
      'Damaged EGR valve control solenoid',
      'Failed EGR temperature sensor',
      'Vacuum leak in EGR system'
    ],
    solutions: [
      'Clean EGR passages and ports',
      'Replace EGR valve if damaged or stuck',
      'Remove carbon deposits from EGR system',
      'Check and replace EGR valve control solenoid if faulty',
      'Test and replace EGR temperature sensor if needed',
      'Repair vacuum leaks in EGR system'
    ],
    safety: 'Work in a well-ventilated area when cleaning EGR components. Use appropriate eye protection.'
  },
  'P0440': {
    description: 'Evaporative Emission Control System Malfunction',
    causes: [
      'Loose or missing gas cap',
      'Damaged fuel tank pressure sensor',
      'Faulty purge or vent solenoid',
      'Cracked or damaged EVAP system hoses',
      'Leaking charcoal canister',
      'Fuel tank leaks'
    ],
    solutions: [
      'Check and replace gas cap if necessary',
      'Test and replace fuel tank pressure sensor if faulty',
      'Inspect and replace purge or vent solenoid if damaged',
      'Check for and replace damaged EVAP hoses',
      'Replace charcoal canister if leaking',
      'Inspect fuel tank for leaks and repair as needed'
    ],
    safety: 'Avoid sparks or open flames when working on fuel system components. Work in a well-ventilated area.'
  },
  'P0455': {
    description: 'Evaporative Emission Control System Leak Detected (Large Leak)',
    causes: [
      'Missing or loose fuel cap',
      'Disconnected or damaged EVAP hoses',
      'Faulty purge valve',
      'Cracked charcoal canister',
      'Damaged fuel tank',
      'Faulty fuel tank pressure sensor'
    ],
    solutions: [
      'Check and tighten or replace fuel cap',
      'Inspect and reconnect or replace EVAP hoses',
      'Test and replace purge valve if necessary',
      'Replace cracked charcoal canister',
      'Inspect and repair fuel tank if damaged',
      'Check and replace fuel tank pressure sensor if faulty'
    ],
    safety: 'Ensure no smoking or open flames when working on fuel system components. Work in a well-ventilated area.'
  },
  'P0442': {
    description: 'Evaporative Emission Control System Leak Detected (Small Leak)',
    causes: [
      'Loose fuel cap',
      'Small crack in EVAP hose',
      'Faulty purge valve or vent valve',
      'Minor leak in charcoal canister',
      'Damaged o-rings or seals in EVAP system',
      'Fuel tank pressure sensor problems'
    ],
    solutions: [
      'Check and properly tighten fuel cap',
      'Inspect and replace any cracked EVAP hoses',
      'Test and replace purge valve or vent valve if necessary',
      'Replace charcoal canister if leaking',
      'Replace damaged o-rings or seals',
      'Test and replace fuel tank pressure sensor if faulty'
    ],
    safety: 'Avoid sources of ignition when working on the EVAP system. Ensure proper ventilation.'
  },
  'B1000': {
    description: 'Driver\'s Airbag Module Resistance Too High',
    causes: [
      'Poor connection in airbag wiring harness',
      'Damaged clock spring',
      'Faulty driver\'s airbag module',
      'Airbag system short circuit',
      'SRS control module issues',
      'Wiring harness damage'
    ],
    solutions: [
      'Check and repair airbag wiring connections',
      'Replace clock spring if damaged',
      'Test and replace driver\'s airbag module if faulty',
      'Repair any short circuits in the system',
      'Check and replace SRS control module if necessary',
      'Inspect and repair wiring harness'
    ],
    safety: 'Disconnect battery and wait at least 10 minutes before working on airbag components to avoid accidental deployment.'
  },
  'C0035': {
    description: 'Left Front Wheel Speed Sensor Circuit Malfunction',
    causes: [
      'Damaged wheel speed sensor',
      'Debris on wheel speed sensor',
      'Broken wiring in wheel speed sensor circuit',
      'Poor connection at wheel speed sensor',
      'ABS control module failure',
      'Damaged tone ring'
    ],
    solutions: [
      'Replace wheel speed sensor if damaged',
      'Clean debris from wheel speed sensor',
      'Repair broken wiring in sensor circuit',
      'Check and repair connections at sensor',
      'Test and replace ABS control module if necessary',
      'Inspect and replace tone ring if damaged'
    ],
    safety: 'Ensure vehicle is properly supported before working under it. Use jack stands for safety.'
  },
  'U0101': {
    description: 'Lost Communication with Transmission Control Module (TCM)',
    causes: [
      'Damaged wiring between ECM and TCM',
      'Poor connection at TCM',
      'Faulty TCM',
      'CAN bus circuit issues',
      'ECM failure',
      'Power supply issue to TCM'
    ],
    solutions: [
      'Inspect and repair wiring between ECM and TCM',
      'Check and clean connections at TCM',
      'Test and replace TCM if faulty',
      'Diagnose and repair CAN bus circuit issues',
      'Verify ECM operation and replace if necessary',
      'Check power supply to TCM and repair as needed'
    ],
    safety: 'Disconnect battery before working on electrical components. Use proper diagnostic tools to avoid damage.'
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

// Add OBD code website references for scraping
const obdCodeWebsites = [
  {
    name: 'FaultCodes.co',
    url: 'https://faultcodes.co',
    pattern: (code, manufacturer) => {
      // Check if manufacturer is provided
      if (manufacturer) {
        // Convert manufacturer to lowercase and remove spaces
        const mfr = manufacturer.toLowerCase().replace(/\s+/g, '-');
        return `https://faultcodes.co/cars/${mfr}/${code.toLowerCase()}`;
      }
      // If no manufacturer, use the general code lookup
      return `https://faultcodes.co/code/${code.toLowerCase()}`;
    },
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.code-description, .fault-description h2 + p',
      causes: '.possible-causes ul, .fault-causes ul',
      solutions: '.recommended-fixes ul, .fault-solutions ul',
      severity: '.severity-level'
    },
    manufacturerList: [
      'acura', 'alfa-romeo', 'audi', 'bmw', 'buick', 'cadillac', 'chevrolet', 
      'chrysler', 'citroen', 'dacia', 'dodge', 'fiat', 'ford', 'gmc', 'honda', 
      'hyundai', 'infiniti', 'jaguar', 'jeep', 'kia', 'land-rover', 'lexus', 
      'lincoln', 'mazda', 'mercedes-benz', 'mercury', 'mini', 'mitsubishi', 
      'nissan', 'opel', 'peugeot', 'pontiac', 'porsche', 'renault', 'saab', 
      'seat', 'skoda', 'subaru', 'suzuki', 'toyota', 'volkswagen', 'volvo'
    ]
  },
  {
    name: 'OBD-Codes.com',
    url: 'https://www.obd-codes.com/p',
    pattern: code => `https://www.obd-codes.com/p${code.substring(1)}`,
    applicable: code => code.startsWith('P') && !isNaN(parseInt(code.substring(1))),
    selector: {
      description: '.intext > h2:first-of-type, .intext > p:nth-of-type(1)',
      causes: '.intext > ul:nth-of-type(1)',
      solutions: '.intext > ul:nth-of-type(2), .intext > p:nth-of-type(3) + ul'
    }
  },
  {
    name: 'AutoCodes.com',
    url: 'https://www.autocodes.com/p',
    pattern: code => `https://www.autocodes.com/${code.toLowerCase()}.html`,
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.entry-content > p:nth-of-type(1)',
      causes: '.entry-content > ul:nth-of-type(1), .causes-list',
      solutions: '.entry-content > ul:nth-of-type(2), .solutions-list'
    }
  },
  {
    name: 'OBD2AI.com',
    url: 'https://obd2ai.com/free-obd2-code-lookup-tool',
    pattern: code => `https://obd2ai.com/p${code.substring(1)}`,
    applicable: code => code.startsWith('P') && !isNaN(parseInt(code.substring(1))),
    selector: {
      description: '.entry-content > p:nth-child(1)',
      causes: '.entry-content > h3:contains("Possible Causes") + ul',
      solutions: '.entry-content > h3:contains("Solutions") + ul'
    }
  },
  {
    name: 'DTCSearch.com',
    url: 'https://www.dtcsearch.com',
    pattern: code => `https://www.dtcsearch.com/index.php?action=search&dtccode=${code}`,
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.code-description',
      causes: '.possible-causes ul',
      solutions: '.solutions ul'
    }
  },
  {
    name: 'OBD2Site.com',
    url: 'https://www.obd2site.com/code-lookup',
    pattern: code => `https://www.obd2site.com/code-lookup/${code}`,
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.code-info p:first-of-type',
      causes: '.causes-list',
      solutions: '.solutions-list'
    }
  },
  {
    name: 'RepairPal.com',
    url: 'https://repairpal.com/obd-ii-code-chart',
    pattern: code => `https://repairpal.com/obd-ii-code-chart/${code.toLowerCase()}`,
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.code-description',
      causes: '.code-details ul:first-of-type',
      solutions: '.code-details ul:last-of-type'
    }
  },
  {
    name: 'Innova.com',
    url: 'https://www.innova.com/pages/dtc-library',
    pattern: code => `https://www.innova.com/pages/dtc-library?code=${code}`,
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.code-detail h2 + p',
      causes: '.common-causes ul',
      solutions: '.recommended-fixes ul'
    }
  },
  {
    name: 'OBDAdvisor.com',
    url: 'https://obdadvisor.com/codes',
    pattern: code => `https://obdadvisor.com/codes/${code.toLowerCase()}`,
    applicable: code => /^[PBCU][0-9]{4}$/.test(code),
    selector: {
      description: '.code-meaning',
      causes: '.code-causes ul',
      solutions: '.code-solutions ul'
    }
  }
];

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

// Function to scrape fault code information from specialized OBD websites
async function scrapeOBDCodeInfo(code) {
  // Normalize the code to uppercase
  const normalizedCode = code.toUpperCase();
  
  // Find applicable websites for this code
  const applicableWebsites = obdCodeWebsites.filter(site => site.applicable(normalizedCode));
  
  if (applicableWebsites.length === 0) {
    console.log(`No specialized OBD websites available for code: ${normalizedCode}`);
    return null;
  }
  
  // Try each website until we find information
  for (const site of applicableWebsites) {
    try {
      console.log(`Attempting to scrape from ${site.name}...`);
      
      // Generate the URL for this code
      const url = site.pattern(normalizedCode);
      
      // Make the request with a user agent to avoid being blocked
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000 // 5 second timeout
      });
      
      // Parse the HTML response
      const $ = cheerio.load(response.data);
      
      // Extract information using the site's selectors
      let description = $(site.selector.description).first().text().trim();
      
      // Extract causes
      const causes = [];
      $(site.selector.causes).find('li').each((i, el) => {
        causes.push($(el).text().trim());
      });
      
      // Extract solutions
      const solutions = [];
      $(site.selector.solutions).find('li').each((i, el) => {
        solutions.push($(el).text().trim());
      });
      
      // If we found some information, return it
      if (description || causes.length > 0 || solutions.length > 0) {
        console.log(`Successfully scraped data from ${site.name}`);
        return {
          description: description || `Fault code ${normalizedCode}`,
          causes: causes.length > 0 ? causes : ['Information not available'],
          solutions: solutions.length > 0 ? solutions : ['Information not available'],
          source: url
        };
      }
    } catch (error) {
      console.error(`Error scraping from ${site.name}:`, error.message);
      // Continue to the next site if there's an error
    }
  }
  
  // If all specialized sites failed, return null
  console.log(`Failed to find information on specialized OBD websites for: ${normalizedCode}`);
  return null;
}

// Function to scrape manufacturer-specific fault code information
async function scrapeManufacturerFaultCodes(code, equipment) {
  try {
    // Convert equipment to lowercase for easier matching
    const equipmentLower = equipment.toLowerCase();
    
    // Identify if the equipment matches any manufacturer
    let manufacturer = null;
    
    // Check against manufacturer list from FaultCodes.co
    const fcSite = obdCodeWebsites.find(site => site.name === 'FaultCodes.co');
    if (fcSite) {
      for (const mfr of fcSite.manufacturerList) {
        // Replace hyphens with spaces for matching
        const mfrName = mfr.replace(/-/g, ' ');
        if (equipmentLower.includes(mfrName)) {
          manufacturer = mfr;
          break;
        }
      }
      
      // If no exact match but automotive keywords present, try some common manufacturers
      if (!manufacturer && 
          (equipmentLower.includes('car') || 
           equipmentLower.includes('truck') || 
           equipmentLower.includes('vehicle') ||
           equipmentLower.includes('automotive'))) {
        // Try to find common car brands in the equipment description
        const commonBrands = ['toyota', 'honda', 'ford', 'chevrolet', 'bmw', 'audi', 'mercedes', 'volkswagen'];
        for (const brand of commonBrands) {
          if (equipmentLower.includes(brand)) {
            manufacturer = brand.replace(/\s+/g, '-');
            break;
          }
        }
      }
    }
    
    if (manufacturer && fcSite) {
      console.log(`Attempting to scrape from FaultCodes.co for manufacturer: ${manufacturer}`);
      
      // Generate the URL for this code and manufacturer
      const url = fcSite.pattern(code, manufacturer);
      
      try {
        // Make the request with a user agent to avoid being blocked
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 7000 // 7 second timeout
        });
        
        // Parse the HTML response
        const $ = cheerio.load(response.data);
        
        // Extract information using the site's selectors
        let description = $(fcSite.selector.description).first().text().trim();
        
        // Extract causes
        const causes = [];
        $(fcSite.selector.causes).find('li').each((i, el) => {
          causes.push($(el).text().trim());
        });
        
        // Extract solutions
        const solutions = [];
        $(fcSite.selector.solutions).find('li').each((i, el) => {
          solutions.push($(el).text().trim());
        });
        
        // Extract severity if available
        const severity = $(fcSite.selector.severity).text().trim();
        
        // If we found some information, return it
        if (description || causes.length > 0 || solutions.length > 0) {
          console.log(`Successfully scraped data from FaultCodes.co for ${manufacturer}`);
          return {
            description: description || `Fault code ${code} for ${manufacturer}`,
            causes: causes.length > 0 ? causes : ['Information not available'],
            solutions: solutions.length > 0 ? solutions : ['Information not available'],
            severity: severity || 'Not specified',
            manufacturer: manufacturer.replace(/-/g, ' '),
            source: url
          };
        }
      } catch (error) {
        console.error(`Error scraping from FaultCodes.co for ${manufacturer}:`, error.message);
        // If we get an error, we'll continue with other scraping methods
      }
    }
    
    // If manufacturer-specific lookup failed, return null
    return null;
  } catch (error) {
    console.error('Error in manufacturer scraping:', error);
    return null;
  }
}

// Function to scrape fault code information from the web
async function scrapeFaultCodeInfo(code, equipment) {
  try {
    // Normalize the code for searching
    const searchCode = code.toUpperCase();
    
    // First, check if this is an OBD code (starts with P, B, C, or U followed by numbers)
    if (/^[PBCU][0-9]{4}$/.test(searchCode)) {
      
      // Try to get manufacturer-specific information first
      const manufacturerInfo = await scrapeManufacturerFaultCodes(searchCode, equipment);
      if (manufacturerInfo) {
        return manufacturerInfo;
      }
      
      // Then try the specialized OBD code websites
      if (equipment.toLowerCase().includes('car') || 
          equipment.toLowerCase().includes('truck') || 
          equipment.toLowerCase().includes('vehicle') ||
          equipment.toLowerCase().includes('automotive') ||
          equipment.toLowerCase().includes('engine') ||
          equipment.toLowerCase().includes('motor')) {
        
        // Try to get information from specialized OBD code websites
        const obdInfo = await scrapeOBDCodeInfo(searchCode);
        if (obdInfo) {
          return obdInfo;
        }
      }
    }
    
    // If the specialized scraping fails or this isn't an OBD code,
    // continue with the general web search method
    
    // Convert equipment to lowercase for easier matching
    const equipmentLower = equipment.toLowerCase();
    
    // Create a more precise search query with quoted terms
    let searchQuery = `"${equipment}" "${searchCode}" fault code`;
    
    // Check for common equipment categories in the input
    if (equipmentLower.includes('car') || 
        equipmentLower.includes('truck') || 
        equipmentLower.includes('vehicle') ||
        equipmentLower.includes('automotive') ||
        equipmentLower.includes('engine') ||
        equipmentLower.includes('motor')) {
      searchQuery = `"automotive" "${searchCode}" fault code`;
    } else if (equipmentLower.includes('aircraft') || 
               equipmentLower.includes('airplane') || 
               equipmentLower.includes('helicopter') ||
               equipmentLower.includes('jet') ||
               equipmentLower.includes('plane')) {
      searchQuery = `"aircraft" "${searchCode}" fault code`;
    } else if (equipmentLower.includes('industrial') || 
               equipmentLower.includes('machine') || 
               equipmentLower.includes('equipment') ||
               equipmentLower.includes('factory') ||
               equipmentLower.includes('manufacturing')) {
      searchQuery = `"industrial" "${searchCode}" fault code`;
    } else if (equipmentLower.includes('printer') || 
               equipmentLower.includes('fax') || 
               equipmentLower.includes('copier') || 
               equipmentLower.includes('scanner') || 
               equipmentLower.includes('network') || 
               equipmentLower.includes('computer') ||
               equipmentLower.includes('laptop') ||
               equipmentLower.includes('desktop') ||
               equipmentLower.includes('monitor') ||
               equipmentLower.includes('device') ||
               equipmentLower.includes('tech') ||
               equipmentLower.includes('electronic')) {
      searchQuery = `"${equipment}" "${searchCode}" fault code`;
    }
    
    console.log(`Searching for: ${searchQuery}`);
    
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

// In-memory storage for pixels
const pixels = [];

// Pixel Canvas API
app.get('/api/pixels', (req, res) => {
  res.json(pixels);
});

app.post('/api/pixels', (req, res) => {
  const { x, y, color } = req.body;
  
  // Validate input
  if (x === undefined || y === undefined || !color) {
    return res.status(400).json({ error: 'Invalid pixel data' });
  }
  
  // Get IP address
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Check if pixel already exists
  const existingPixelIndex = pixels.findIndex(p => p.x === x && p.y === y);
  
  const timestamp = Date.now();
  
  if (existingPixelIndex !== -1) {
    // Update existing pixel
    pixels[existingPixelIndex] = { x, y, color, timestamp, ip };
  } else {
    // Add new pixel
    pixels.push({ x, y, color, timestamp, ip });
  }
  
  res.status(201).json({ success: true });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    localDatabase: true
  });
});

// IP tracking for security purposes
const ipLogs = [];
const MAX_IP_LOGS = 1000; // Limit storage to prevent memory issues

// Admin credentials - in production, use environment variables and proper hashing
const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Root64";

// Middleware to log IP addresses
app.use((req, res, next) => {
  // Get IP address (works behind proxies too)
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Don't log admin requests or health checks
  if (!req.path.startsWith('/admin') && req.path !== '/health') {
    const timestamp = new Date();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const path = req.path;
    
    // Log the IP with timestamp and request info
    ipLogs.unshift({
      ip,
      timestamp,
      userAgent,
      path
    });
    
    // Trim logs if they exceed maximum
    if (ipLogs.length > MAX_IP_LOGS) {
      ipLogs.length = MAX_IP_LOGS;
    }
  }
  
  next();
});

// Login endpoint for admin
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // In a real app, use proper session management
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Admin endpoint to get IP logs (protected)
app.post('/admin/ip-logs', (req, res) => {
  const { username, password } = req.body;
  
  // Verify admin credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ 
      success: true, 
      logs: ipLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

// Admin endpoint to get visitor statistics (protected)
app.post('/admin/stats', (req, res) => {
  const { username, password } = req.body;
  
  // Verify admin credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Calculate visitor statistics
    const totalVisits = ipLogs.length;
    const uniqueIps = [...new Set(ipLogs.map(log => log.ip))].length;
    
    // Calculate active users in last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const activeUsers = [...new Set(ipLogs
      .filter(log => new Date(log.timestamp) > fiveMinutesAgo)
      .map(log => log.ip))].length;
      
    // Get total pixels count
    const pixelsCount = pixels.length;
    
    // Get unique pixel contributors (based on unique IPs)
    const uniqueContributors = [...new Set(pixels
      .filter(pixel => pixel.ip) // Some pixels might not have IP (if added before IP tracking)
      .map(pixel => pixel.ip))].length;
    
    // Find most popular color
    const colorCounts = {};
    pixels.forEach(pixel => {
      if (pixel.color) {
        colorCounts[pixel.color] = (colorCounts[pixel.color] || 0) + 1;
      }
    });
    
    let popularColor = null;
    let maxCount = 0;
    
    Object.entries(colorCounts).forEach(([color, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularColor = color;
      }
    });
    
    // Get last update time
    const lastUpdate = pixels.length > 0 
      ? Math.max(...pixels.map(p => p.timestamp || 0))
      : null;
    
    res.json({
      success: true,
      stats: {
        totalVisits,
        uniqueIps,
        activeUsers,
        pixelsCount,
        uniqueContributors,
        popularColor: popularColor || 'None',
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

// Admin endpoint to get recent activity (protected)
app.post('/admin/recent-activity', (req, res) => {
  const { username, password } = req.body;
  
  // Verify admin credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Combine recent IP logs and pixel placements
    const activities = [];
    
    // Add recent pixel placements
    pixels.slice(0, 20).forEach(pixel => {
      activities.push({
        type: 'Pixel Placed',
        timestamp: pixel.timestamp || Date.now(),
        details: `Pixel placed at (${pixel.x}, ${pixel.y}) with color ${pixel.color}`,
        ip: pixel.ip || 'Unknown'
      });
    });
    
    // Add recent page visits
    ipLogs.slice(0, 20).forEach(log => {
      activities.push({
        type: 'Page Visit',
        timestamp: log.timestamp,
        details: `Visited ${log.path || 'unknown page'}`,
        ip: log.ip
      });
    });
    
    // Sort by timestamp, most recent first
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Return top 20 activities
    res.json({
      success: true,
      activities: activities.slice(0, 20).map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp).toISOString()
      }))
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

// Admin endpoint to ban an IP (protected)
app.post('/admin/ban-ip', (req, res) => {
  const { username, password, ip } = req.body;
  
  // Verify admin credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP address required' });
    }
    
    // In a real application, store banned IPs in a database
    // For simplicity, we'll just acknowledge the request
    res.json({ success: true, message: `IP ${ip} has been banned` });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
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
        // Format the scraped information with manufacturer info if available
        const manufacturerInfo = scrapedInfo.manufacturer ? 
          `Manufacturer: ${scrapedInfo.manufacturer}\n` : '';
        
        const severityInfo = scrapedInfo.severity && scrapedInfo.severity !== 'Not specified' ? 
          `Severity: ${scrapedInfo.severity}\n` : '';
        
        const analysis = `
Fault Code Analysis for ${equipment} - Code: ${code}

${manufacturerInfo}${severityInfo}
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