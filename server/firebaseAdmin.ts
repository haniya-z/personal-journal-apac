import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Load applet config
let config: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json on server:', err);
}

const projectId = config.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT;

let adminApp: App;
if (getApps().length === 0) {
  adminApp = initializeApp({
    projectId: projectId,
  });
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);

// Initialize Firestore with specific database ID if configured
export const adminDb = config.firestoreDatabaseId
  ? getFirestore(adminApp, config.firestoreDatabaseId)
  : getFirestore(adminApp);

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch (err) {
  // Settings might already be locked or initialized
  console.warn('adminDb settings note:', err);
}

// Type for authenticated request
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

/**
 * Express middleware to strictly verify Firebase Authentication ID tokens.
 * Extracts the token from the Authorization header (Bearer <token>).
 * Strictly forbids relying on any client-provided UID in body/params.
 */
export async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header with Bearer token.',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Empty token.' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    // Bind authenticated identity derived strictly from the verified token
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next();
  } catch (error: any) {
    console.warn('[Auth Middleware] Invalid or expired Firebase token:', error?.message || error);
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase authentication token.',
    });
    return;
  }
}
