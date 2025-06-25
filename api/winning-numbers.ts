import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { ensureEnvLoaded, ensureFirebaseInitialized, handleCors, authenticateRequest } from './utils';

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

// Load environment variables and initialize Firebase
ensureEnvLoaded();
ensureFirebaseInitialized();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Use shared CORS handler
  if (handleCors(req, res, ['GET', 'OPTIONS'])) return;

  // Use shared authentication
  if (!(await authenticateRequest(req, res))) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'Missing or invalid date parameter. Use YYYY-MM-DD.' });
    return;
  }

  let parsedDate: Date;
  try {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');
  } catch {
    res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    return;
  }

  // Calculate year, week number, and day of week (1=Mon, 7=Sun)
  const year = parsedDate.getFullYear();
  // Get ISO week number
  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNum;
  };
  const week = getWeekNumber(parsedDate);
  // JS: 0=Sun, 1=Mon... Sazka: 1=Mon, 7=Sun
  let day = parsedDate.getDay();
  day = day === 0 ? 7 : day;

  // Format: YYYYWWD
  const sazkaId = `${year}${week.toString().padStart(2,'0')}${day}`;
  const sazkaUrl = `https://www.sazka.cz/api/draw-info/draws/universal/sportka/${sazkaId}/results`;

  try {
    const response = await fetch(sazkaUrl);
    if (!response.ok) {
      throw new Error(`Sazka API error: ${response.status}`);
    }
    const data = await response.json() as any;
    // Extract only the required fields
    const result = {
      drawDate: data.drawDate,
      mainGame1Numbers: data.numbers?.mainGameNumbers?.[0]?.drawingDrums?.[0] || [],
      mainGame1Extra: data.numbers?.mainGameNumbers?.[0]?.extraNumber ?? null,
      mainGame2Numbers: data.numbers?.mainGameNumbers?.[1]?.drawingDrums?.[0] || [],
      mainGame2Extra: data.numbers?.mainGameNumbers?.[1]?.extraNumber ?? null,
      addonNumbers: data.numbers?.addonNumbers || []
    };
    res.json(result);
  } catch (error) {
    console.error('Error fetching Sazka API:', error);
    res.status(500).json({ error: 'Failed to fetch winning numbers from Sazka.' });
  }
} 
