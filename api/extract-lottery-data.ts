import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import { IncomingForm, File, Fields, Files } from 'formidable';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
if (!process.env.GEMINI_API_KEY) {
  dotenv.config();
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Try to extract JSON from a code block or from anywhere in the text
function extractJsonFromText(text: string): any {
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
    }
    const genericBlockMatch = text.match(/```[\s\S]*?```/);
    if (genericBlockMatch) {
        const inner = genericBlockMatch[0].replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        return JSON.parse(inner);
    }
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new IncomingForm();
  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) {
      res.status(400).json({ error: 'Error parsing form data' });
      return;
    }
    let file = files.lotteryImage as File | File[] | undefined;
    if (!file) {
      res.status(400).json({ error: 'No image file uploaded.' });
      return;
    }
    if (Array.isArray(file)) {
      file = file[0];
    }
    const imageBuffer = fs.readFileSync(file.filepath);
    const mimeType = file.mimetype || 'image/png';
    const base64Image = imageBuffer.toString('base64');

    try {
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
      try {
        const parsedData = extractJsonFromText(responseText);
        res.json(parsedData);
      } catch (jsonError) {
        console.error("Failed to parse Gemini response as JSON. Raw response (cleaned):", responseText);
        res.status(500).json({ error: "Could not parse data from AI. Raw response: " + responseText });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ error: 'Error processing image.' });
    }
  });
} 
