// Configuration settings for the Fault Code Analyzer application

require('dotenv').config(); // Load environment variables if available

const config = {
  // Server settings
  server: {
    port: process.env.PORT || 10000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  // API settings for fault code lookup
  api: {
    faultCodeUrl: process.env.FAULT_CODE_API_URL || 'https://api.faultcodes.example.com/v1',
    faultCodeKey: process.env.FAULT_CODE_API_KEY || '',
    timeout: 5000 // 5 second timeout
  },
  
  // OpenAI API settings
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  },
  
  // Application settings
  app: {
    pixelCanvasSize: 100,
    pixelCooldownSeconds: 3,
    maxIpLogs: 1000
  },
  
  // Admin access
  admin: {
    username: process.env.ADMIN_USERNAME || 'Admin',
    password: process.env.ADMIN_PASSWORD || 'Root64'
  }
};

module.exports = config; 