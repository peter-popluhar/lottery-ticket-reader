const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
const port = 3001; // Or any available port

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use gemini-1.5-flash for image understanding

const upload = multer({ storage: multer.memoryStorage() }); // Store image in memory

app.use(cors()); // Enable CORS for local development

app.post('/extract-lottery-data', upload.single('lotteryImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No image file uploaded.');
        }

        const imageBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        const base64Image = imageBuffer.toString('base64');

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
            "Extract the winning numbers, date, and Sance number from this lottery ticket. Format the output as a JSON object with 'date', 'sanceNumber', and 'winningNumbers' (an array of strings, where each string represents a row of numbers like '05 21 32 36 38 46 NT').",
        ]);

        const responseText = result.response.text();

        let jsonString = responseText;

        // Check if the response is wrapped in Markdown code blocks
        if (jsonString.startsWith('```json') && jsonString.endsWith('```')) {
            // Remove the '```json' at the start and '```' at the end
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        } else if (jsonString.startsWith('```') && jsonString.endsWith('```')) {
            // Handle generic code blocks if 'json' isn't always specified
            jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        }

        // Attempt to parse the response as JSON.
        // Gemini is good at following instructions, but you might need more robust parsing
        // or error handling depending on the exact output format.
        try {
            const parsedData = JSON.parse(jsonString); // Use the cleaned string here
            res.json(parsedData);
        } catch (jsonError) {
            console.error("Failed to parse Gemini response as JSON. Raw response (cleaned):", jsonString);
            console.error("Original raw response:", responseText); // Log original for debugging
            res.status(500).json({ error: "Could not parse data from AI. Raw response: " + responseText });
        }

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image.');
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
