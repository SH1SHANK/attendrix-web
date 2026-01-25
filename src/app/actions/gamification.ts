"use server";

import { getAdminFirestore } from "@/lib/firebase-admin";

export async function getUserAmplix(uid: string) {
  if (!uid) return null;

  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) return null;

    const data = doc.data();
    return data?.amplix || 0;
  } catch (error) {
    console.error("Error fetching Amplix:", error);
    return null;
  }
}
