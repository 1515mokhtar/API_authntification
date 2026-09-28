export interface SecurityLog {
  userId?: string;
  action: 'password_reset' | 'failed_attempt';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: any;
} 