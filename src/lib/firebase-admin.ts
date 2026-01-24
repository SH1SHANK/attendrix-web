import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // Basic initialization - supports standard env vars like GOOGLE_APPLICATION_CREDENTIALS
    // or FIREBASE_CONFIG in some hosting environments.
    // If specific service account JSON is expected in an env var:
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountVar) {
      // Parse if it's a JSON string
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to default (works in Cloud Functions / Google Cloud)
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

const firestore = admin.firestore();
export { firestore };
