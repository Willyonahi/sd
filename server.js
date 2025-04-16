require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { equipment, code } = req.body;
    
    const prompt = `Analyze the following fault code ${code} for ${equipment}. 
    Provide a detailed explanation of what the issue is and step-by-step instructions on how to fix it. 
    Include safety precautions if necessary. Format the response in clear paragraphs.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to analyze fault code' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 