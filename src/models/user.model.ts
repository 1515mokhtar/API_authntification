export interface User {
  id: string;
  name: string; // chiffré
  email: string; // chiffré
  passwordHash: string;
  planType: 'free' | 'premium' | 'enterprise';
  planExpiration: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  isActive: boolean;
  lastPasswordReset?: Date;
} 