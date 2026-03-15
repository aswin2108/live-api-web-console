import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { CarInfo, Defect, Report } from "../store/carcheck-store";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Only initialize if projectId is provided
const app = firebaseConfig.projectId ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

export async function saveInspectionReport(
  carInfo: CarInfo,
  defects: Defect[],
  report: Report
): Promise<void> {
  if (!db) {
    console.warn("Firestore not configured — skipping save.");
    return;
  }
  try {
    await addDoc(collection(db, "inspections"), {
      carInfo,
      defects,
      report,
      createdAt: new Date().toISOString(),
    });
    console.log("Inspection saved to Firestore.");
  } catch (e) {
    console.error("Failed to save to Firestore:", e);
  }
}
