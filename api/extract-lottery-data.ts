import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import { IncomingForm, File, Fields, Files } from 'formidable';
import fs from 'fs';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { ensureEnvLoaded, ensureFirebaseInitialized, handleCors, authenticateRequest } from './utils';
import { prompt } from './prompt';

// Load environment variables
if (!process.env.GEMINI_API_KEY) {
  dotenv.config();
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
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
  // Use shared CORS handler
  if (handleCors(req, res, ['POST', 'OPTIONS'])) return;

  // Use shared authentication
  if (!(await authenticateRequest(req, res))) return;

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
        prompt,
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
