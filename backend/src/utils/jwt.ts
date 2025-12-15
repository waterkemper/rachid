import jwt from 'jsonwebtoken';

export interface JwtPayload {
  usuarioId: number;
  email: string;
}

export function generateToken(payload: JwtPayload): string {
  const secret: jwt.Secret = process.env.JWT_SECRET || 'default_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  const options: jwt.SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JwtPayload {
  const secret: jwt.Secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.verify(token, secret) as JwtPayload;
}

