import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables if not already loaded
export function ensureEnvLoaded() {
  if (!process.env.GEMINI_API_KEY) {
    dotenv.config();
  }
}

// Initialize Firebase Admin SDK if not already initialized
export function ensureFirebaseInitialized() {
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
}

// Set CORS headers and handle preflight
export function handleCors(req: VercelRequest, res: VercelResponse, allowedMethods: string[]): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Authenticate user by Firebase ID token and allowed email
export async function authenticateRequest(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const allowedEmail = process.env.ALLOWED_USER_EMAIL!;
    if (decodedToken.email !== allowedEmail) {
      res.status(403).json({ error: 'Forbidden: You are not allowed to use this API.' });
      return false;
    }
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    return false;
  }
} 
