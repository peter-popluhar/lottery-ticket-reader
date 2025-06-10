import express, { Request, Response } from 'express';
import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import multer, { Multer, memoryStorage } from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const port = 3001; // Or any available port

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use gemini-1.5-flash for image understanding

const upload: Multer = multer({ storage: memoryStorage() }); // Store image in memory

app.use(cors()); // Enable CORS for local development

// Try to extract JSON from a code block or from anywhere in the text
function extractJsonFromText(text: string): any {
    // Try to find a ```json ... ``` code block
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
    }
    // Try to find a generic ``` ... ``` code block
    const genericBlockMatch = text.match(/```[\s\S]*?```/);
    if (genericBlockMatch) {
        // Remove the backticks and parse
        const inner = genericBlockMatch[0].replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        return JSON.parse(inner);
    }
    // Fallback: find the first JSON object in the text
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
}

app.post('/extract-lottery-data', upload.single('lotteryImage'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).send('No image file uploaded.');
            return;
        }

        const imageBuffer: Buffer = req.file.buffer;
        const mimeType: string = req.file.mimetype;

        const base64Image: string = imageBuffer.toString('base64');

        const result: GenerateContentResult = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
            "Extract the winning numbers, date, and Sance number from this lottery ticket. Format the output as a JSON object with 'date' (date after string 'POCET SLOSOVANI'), 'sanceNumber' (number after string 'Sance' in a same row, like '089229' with no colons or semicolons), and 'winningNumbers' (an array of strings, where each string represents a row of numbers like '05 21 32 36 38 46 NT').",
        ]);

        const responseText: string = result.response.text();

        // Attempt to parse the response as JSON.
        try {
            const parsedData = extractJsonFromText(responseText);
            res.json(parsedData);
        } catch (jsonError) {
            console.error("Failed to parse Gemini response as JSON. Raw response (cleaned):", responseText);
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
