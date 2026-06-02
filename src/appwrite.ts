import { Client, Account, Databases } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  // Fail loud at import-time so misconfiguration shows up immediately.
  console.error(
    "Appwrite env vars missing. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID.",
  );
}

export const appwriteClient = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const APPWRITE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
