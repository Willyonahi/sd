require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize OpenAI client if API key is available
let openai = null;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (openaiApiKey) {
  try {
    openai = new OpenAI({
      apiKey: openaiApiKey
    });
    console.log('OpenAI client initialized successfully');
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
  }
}

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
  }
};

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
      // If code not found in database, try to use ChatGPT if available
      if (openai) {
        try {
          const prompt = `Analyze the following fault code ${code} for ${equipment}. 
          Provide a detailed explanation of what the issue is and step-by-step instructions on how to fix it. 
          Include safety precautions if necessary. Format the response in clear paragraphs.`;

          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
          });

          res.json({ analysis: completion.choices[0].message.content });
        } catch (error) {
          console.error('Error calling OpenAI API:', error);
          // Fall back to generic response if OpenAI fails
          const analysis = `
Fault Code Analysis for ${equipment} - Code: ${code}

We don't have specific information about this fault code in our database. Here are some general troubleshooting steps:

1. Consult your equipment's service manual for specific information about this fault code
2. Check for obvious issues like loose connections, damaged wires, or fluid leaks
3. Verify that all sensors related to this system are functioning properly
4. Check if there are any recent maintenance issues that might be related
5. Consider consulting a qualified technician for this specific fault code

Safety Precautions:
- Always follow proper safety procedures when working on equipment
- Ensure power is disconnected before working on electrical components
- Use appropriate personal protective equipment
- Follow manufacturer-specific safety guidelines

Note: For accurate diagnosis and repair, please consult your equipment's service manual or a qualified technician.
          `;
          
          res.json({ analysis });
        }
      } else {
        // If OpenAI is not available, provide a generic response
        const analysis = `
Fault Code Analysis for ${equipment} - Code: ${code}

We don't have specific information about this fault code in our database. Here are some general troubleshooting steps:

1. Consult your equipment's service manual for specific information about this fault code
2. Check for obvious issues like loose connections, damaged wires, or fluid leaks
3. Verify that all sensors related to this system are functioning properly
4. Check if there are any recent maintenance issues that might be related
5. Consider consulting a qualified technician for this specific fault code

Safety Precautions:
- Always follow proper safety procedures when working on equipment
- Ensure power is disconnected before working on electrical components
- Use appropriate personal protective equipment
- Follow manufacturer-specific safety guidelines

Note: For accurate diagnosis and repair, please consult your equipment's service manual or a qualified technician.
        `;
        
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
  if (openai) {
    console.log('OpenAI integration is active - will use ChatGPT for unknown fault codes');
  } else {
    console.log('Using local fault code database only - no API key configured');
  }
}); 