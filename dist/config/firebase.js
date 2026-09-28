"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebase = initializeFirebase;
exports.getFirestore = getFirestore;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
function getCredential() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        return firebase_admin_1.default.credential.cert(serviceAccount);
    }
    return firebase_admin_1.default.credential.applicationDefault();
}
function initializeFirebase() {
    if (!firebase_admin_1.default.apps.length) {
        firebase_admin_1.default.initializeApp({
            credential: getCredential(),
        });
    }
}
function getFirestore() {
    return firebase_admin_1.default.firestore();
}
