require('dotenv').config();
const OpenAI = require('openai').default;

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

async function chat() {
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'user', content: 'What is Stokvel?' }
            ],
            max_tokens: 150,
        });
        console.log('Response:', response.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

chat();