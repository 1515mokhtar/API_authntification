export interface PasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  ipAddress?: string;
  userAgent?: string;
} 