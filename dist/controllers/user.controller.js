"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.getUserConnections = getUserConnections;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const firebase_1 = require("../config/firebase");
async function getUser(req, res) {
    try {
        const { id } = req.params;
        const firestore = (0, firebase_1.getFirestore)();
        const userDoc = await firestore.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userDoc.data();
        if (user)
            delete user.passwordHash;
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to get user', error: err.message });
    }
}
async function getUserConnections(req, res) {
    try {
        const { id } = req.params;
        const firestore = (0, firebase_1.getFirestore)();
        const snapshot = await firestore.collection('userConnectionLogs')
            .where('userId', '==', id)
            .orderBy('timestamp', 'desc')
            .get();
        const logs = snapshot.docs.map(doc => doc.data());
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to get user connections', error: err.message });
    }
}
async function updateUser(req, res) {
    // À implémenter
    res.status(501).json({ message: 'Not implemented' });
}
async function deleteUser(req, res) {
    // À implémenter
    res.status(501).json({ message: 'Not implemented' });
}
