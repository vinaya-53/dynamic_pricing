// utils/auth.ts

import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // Recommended salt rounds
  return await bcrypt.hash(password, saltRounds);
}
