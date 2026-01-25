import "server-only";
import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK Initialization
 *
 * ENVIRONMENT VARIABLES (standardized naming):
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_CLIENT_EMAIL: Service account email
 * - FIREBASE_PRIVATE_KEY: Service account private key (with \n escapes)
 *
 * This module:
 * - Validates all required env vars at startup (fail-fast)
 * - Uses singleton pattern to prevent multiple initializations
 * - Sanitizes private key newlines for cross-platform compatibility
 */

// =============================================================================
// STRICT STARTUP VALIDATION
// =============================================================================

export function initAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [];
    if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");

    throw new Error(
      `[Firebase Admin] FATAL: Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  // Sanitize private key: handle Vercel/System newlines and quotes
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  console.log(`[Firebase Admin] Initializing for project: ${projectId}`);

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

// =============================================================================
// EXPORTED SERVICE GETTERS
// =============================================================================

/**
 * Returns an authenticated Firestore instance.
 * Lazily initializes the Admin SDK if not already done.
 */
export function getAdminFirestore(): Firestore {
  initAdmin();
  return getFirestore();
}

/**
 * Returns an authenticated Auth instance.
 * Lazily initializes the Admin SDK if not already done.
 */
export function getAdminAuth(): Auth {
  initAdmin();
  return getAuth();
}
