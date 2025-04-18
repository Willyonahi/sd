# Fault Code Analyzer

An AI-powered web application that provides detailed analysis and repair steps for fault codes across various equipment types.

## Features

- Input equipment type and fault code
- AI-powered analysis of the issue
- Detailed repair instructions
- Safety precautions included
- Modern, responsive UI

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - Name: fault-code-analyzer
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 10000

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Add your OpenAI API key to the `.env` file
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Server port (defaults to 10000)

## Technologies Used

- Node.js
- Express
- OpenAI API
- HTML/CSS/JavaScript
- Tailwind CSS 