import { Request, Response } from 'express';
const bcrypt = require('bcryptjs');
import jwt, { SignOptions } from 'jsonwebtoken';
import { getFirestore } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { getMailTransport, EMAIL_FROM, FRONTEND_URL } from '../config/mail';
import admin from 'firebase-admin';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, country } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const firestore = getFirestore();
    const usersRef = firestore.collection('users');
    // Vérifie si l'email existe déjà
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);
    // Génère un nouvel ID utilisateur
    const userId = uuidv4();
    const now = new Date();
    // Crée l'utilisateur
    const user = {
      id: userId,
      name, // à chiffrer si besoin
      email, // à chiffrer si besoin
      passwordHash,
      planType: 'free',
      planExpiration: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 jours gratuits
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      isActive: true,
      country: country || null,
      role: 'guest',
    };
    await usersRef.doc(userId).set(user);
    res.status(200).json({ message: 'User registered successfully', userId });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: (err as Error).message });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password, country } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const firestore = getFirestore();
    const usersRef = firestore.collection('users');
    // Vérifie si l'email existe déjà
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);
    // Génère un nouvel ID utilisateur
    const userId = uuidv4();
    const now = new Date();
    // Crée l'utilisateur avec role 'guest'
    const user = {
      id: userId,
      name,
      email,
      passwordHash,
      planType: 'free',
      planExpiration: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      isActive: true,
      country: country || null,
      role: 'guest',
    };
    await usersRef.doc(userId).set(user);
    res.status(200).json({ message: 'User signed up successfully', userId });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: (err as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const firestore = getFirestore();
  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();

  // Vérifie le mot de passe
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Vérifie que le compte est actif
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account is deactivated' });
  }

  // Génère le token JWT
  const token = jwt.sign(
    {
      userId: user.id,
      planType: user.planType,
      planExpiration: user.planExpiration instanceof Date ? user.planExpiration.getTime() : user.planExpiration,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as SignOptions
  );

  // Log la connexion
  await firestore.collection('userConnectionLogs').add({
    userId: user.id,
    type: 'login',
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || ''
  });

  res.json({ token, userId: user.id });
}

export async function verifyToken(req: Request, res: Response) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided or invalid format' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user data from database
    const firestore = getFirestore();
    const userDoc = await firestore.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData || !userData.isActive) {
      return res.status(403).json({ message: 'User account is deactivated' });
    }

    // Remove sensitive data before sending
    const { passwordHash, ...userInfo } = userData;

    res.json({
      message: 'Token is valid',
      user: userInfo,
      token: token
    });

  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('[VERIFY TOKEN ERROR]', err);
    res.status(500).json({ message: 'Token verification failed', error: (err as Error).message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const firestore = getFirestore();
  const usersRef = firestore.collection('users');
  let userId: string | null = null;

  try {
    // Recherche utilisateur (case insensitive)
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      userId = snapshot.docs[0].id;
      // Génère un token sécurisé
      const token = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      const passwordResetRef = firestore.collection('passwordResetTokens').doc(token);

      await passwordResetRef.set({
        userId,
        token,
        expiresAt,
        used: false,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      // Envoi d'un vrai email de reset
      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
      const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject: '🔒 Password Reset Request - Auth API',
        text: `You requested a password reset.\n\nCopiez ce token : ${token}\nOu cliquez sur ce lien : ${resetUrl}\n\nCe lien expire dans 15 minutes.\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
            <h2 style="color: #2d8cf0; margin-top: 0;">🔒 Réinitialisation de mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur <b>Auth API</b>.</p>
            <p style="font-size: 1.1em; background: #f5f7fa; border-radius: 6px; padding: 12px; margin: 18px 0;">
              <span style="font-size: 1.3em;">🆔</span> <b>Token :</b> <span style="font-family: monospace;">${token}</span>
            </p>
            <p style="margin: 18px 0;">
              <span style="font-size: 1.3em;">🔗</span> <b>Lien direct :</b><br>
              <a href="${resetUrl}" style="color: #2d8cf0; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #e67e22; font-weight: bold;">⏰ Ce lien expire dans 15 minutes.</p>
            <p style="color: #e74c3c;">⚠️ Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 0.95em; color: #888;">Merci d'utiliser Auth API.<br>— L'équipe Auth API</p>
          </div>
        `
      };
      try {
        const mailTransport = getMailTransport();
        await mailTransport.sendMail(mailOptions);
      } catch (mailErr) {
        console.error('[MAIL ERROR]', mailErr);
      }
    }

    // Toujours retourner un message générique
    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (err) {
    // Loggue l’erreur côté serveur
    console.error('[FORGOT PASSWORD ERROR]', err);
    res.status(500).json({
      message: 'An error occurred while processing the request.',
      error: (err as Error).message
    });
  }
}

export async function validateResetToken(req: Request, res: Response) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  const firestore = getFirestore();
  const resetTokenRef = firestore.collection('passwordResetTokens').doc(token);
  try {
    const tokenDoc = await resetTokenRef.get();
    if (!tokenDoc.exists) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const tokenData = tokenDoc.data();
    if (!tokenData || tokenData.used) {
      return res.status(400).json({ message: 'Token already used or invalid' });
    }
    if (tokenData.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ message: 'Token expired' });
    }
    res.json({ message: 'Token is valid' });
  } catch (err) {
    console.error('[VALIDATE RESET TOKEN ERROR]', err);
    res.status(500).json({ message: 'An error occurred while validating the token.', error: (err as Error).message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and newPassword are required' });
  }

  const firestore = getFirestore();
  const resetTokenRef = firestore.collection('passwordResetTokens').doc(token);
  try {
    const tokenDoc = await resetTokenRef.get();
    if (!tokenDoc.exists) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const tokenData = tokenDoc.data();
    if (!tokenData || tokenData.used) {
      return res.status(400).json({ message: 'Token already used or invalid' });
    }
    if (tokenData.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ message: 'Token expired' });
    }

    // Récupère l'utilisateur
    const userRef = firestore.collection('users').doc(tokenData.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash le nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRef.update({ passwordHash, updatedAt: new Date(), lastPasswordReset: new Date() });
    await resetTokenRef.update({ used: true });

    // (Optionnel) Invalider toutes les sessions existantes ici

    // (Optionnel) Envoyer un email de confirmation ici

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err);
    res.status(500).json({ message: 'An error occurred while resetting the password.', error: (err as Error).message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const firestore = getFirestore();
    await firestore.collection('userConnectionLogs').add({
      userId,
      type: 'logout',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });
    res.json({ message: 'User logged out and session recorded.' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: (err as Error).message });
  }
} 

export async function googleLogin(req: Request, res: Response) {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    // Verify the Google ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email is required from Google account' });
    }

    const firestore = getFirestore();
    const usersRef = firestore.collection('users');
    
    // Check if user already exists
    let userDoc = await usersRef.doc(uid).get();
    
    if (!userDoc.exists) {
      // Create new user from Google account
      const now = new Date();
      const newUser = {
        id: uid,
        name: name || 'Google User',
        email: email,
        googleId: uid,
        profilePicture: picture || null,
        planType: 'free',
        planExpiration: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        isActive: true,
        role: 'guest',
        loginMethod: 'google'
      };
      
      await usersRef.doc(uid).set(newUser);
      userDoc = await usersRef.doc(uid).get();
    } else {
      // Update last login for existing user
      await usersRef.doc(uid).update({
        lastLogin: new Date(),
        updatedAt: new Date()
      });
    }

    const userData = userDoc.data();
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: uid,
        planType: userData?.planType || 'free',
        planExpiration: userData?.planExpiration instanceof Date ? userData.planExpiration.getTime() : (userData?.planExpiration || Date.now()),
      },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as SignOptions
    );

    // Log the Google login
    await firestore.collection('userConnectionLogs').add({
      userId: uid,
      type: 'google_login',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    const userInfo = userData || {
      name: name || 'Google User',
      email: email,
      profilePicture: picture,
      planType: 'free',
      role: 'guest'
    };

    res.json({ 
      token, 
      userId: uid,
      user: {
        id: uid,
        name: userInfo.name,
        email: userInfo.email,
        profilePicture: userInfo.profilePicture,
        planType: userInfo.planType,
        role: userInfo.role
      }
    });

  } catch (err) {
    console.error('[GOOGLE LOGIN ERROR]', err);
    res.status(500).json({ 
      message: 'Google authentication failed', 
      error: (err as Error).message 
    });
  }
}

export async function googleCallback(req: Request, res: Response) {
  // This can be used for additional Google OAuth flow if needed
  res.status(501).json({ message: 'Google callback not implemented yet' });
} 