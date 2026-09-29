import admin from 'firebase-admin';

function getCredential(): admin.credential.Credential {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
      throw error;
    }
  }
  console.error('FIREBASE_SERVICE_ACCOUNT not set, falling back to applicationDefault');
  return admin.credential.applicationDefault();
}

export function initializeFirebase() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: getCredential(),
      });
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

export function getFirestore() {
  return admin.firestore();
} 