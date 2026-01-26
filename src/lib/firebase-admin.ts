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

// =============================================================================
// ROBUST SANITIZATION & INITIALIZATION
// =============================================================================

function sanitizeEnv(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return val
    .trim()
    .replace(/^-n\s+/, "") // Remove 'echo -n' artifacts
    .replace(/^"(.*)"$/, "$1") // Remove surrounding double quotes
    .replace(/^'(.*)'$/, "$1"); // Remove surrounding single quotes
}

export function initAdmin(): App {
  // 1. Thread-safe Singleton: check existing apps first
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // 2. Prioritized & Sanitized Lookup
  const projectId = sanitizeEnv(
    process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID,
  );
  const clientEmail = sanitizeEnv(
    process.env.FIREBASE_CLIENT_EMAIL ||
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  );
  const rawPrivateKey = sanitizeEnv(
    process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );

  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missing = [];
    if (!projectId) missing.push("PROJECT_ID");
    if (!clientEmail) missing.push("CLIENT_EMAIL");
    if (!rawPrivateKey) missing.push("PRIVATE_KEY");
    throw new Error(
      `[Firebase Admin] Missing credentials: ${missing.join(", ")}`,
    );
  }

  // 3. Precision Private Key Formatting
  // Handle literal \n (typed as 2 chars) and real newlines
  const formattedPrivateKey = rawPrivateKey.replace(/\\n/g, "\n");

  console.log(`[Firebase Admin] Booting for ${projectId}`);

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId,
    });
  } catch (error: any) {
    // 4. Recovery: if parallel init happened anyway, return existing
    if (error.code === "app/duplicate-app") {
      return getApp();
    }
    throw error;
  }
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
