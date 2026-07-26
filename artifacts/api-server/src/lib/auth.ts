import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SESSION_SECRET ?? "socialflow-dev-secret";
const JWT_EXPIRES_IN = "30d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
