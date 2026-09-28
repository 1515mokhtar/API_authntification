import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import path from 'path';
import cors from 'cors';

// Chargement des variables d'environnement
dotenv.config();

console.log('CWD:', process.cwd());
console.log('ENV PATH:', path.resolve('.env'));
console.log('DEBUG ENV:', {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER
});
// Initialisation Firebase
initializeFirebase();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Auth API listening on port ${PORT}`);
  });
}

export default app;