import admin from 'firebase-admin';

function getCredential(): admin.credential.Credential {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return admin.credential.cert(serviceAccount);
  }
  return admin.credential.applicationDefault();
}

export function initializeFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: getCredential(),
    });
  }
}

export function getFirestore() {
  return admin.firestore();
} 