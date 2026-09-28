import { Request, Response } from 'express';
import { getFirestore } from '../config/firebase';

export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const firestore = getFirestore();
    const userDoc = await firestore.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userDoc.data();
    if (user) delete user.passwordHash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user', error: (err as Error).message });
  }
}

export async function getUserConnections(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const firestore = getFirestore();
    const snapshot = await firestore.collection('userConnectionLogs')
      .where('userId', '==', id)
      .orderBy('timestamp', 'desc')
      .get();
    const logs = snapshot.docs.map(doc => doc.data());
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user connections', error: (err as Error).message });
  }
}

export async function updateUser(req: Request, res: Response) {
  // À implémenter
  res.status(501).json({ message: 'Not implemented' });
}

export async function deleteUser(req: Request, res: Response) {
  // À implémenter
  res.status(501).json({ message: 'Not implemented' });
} 