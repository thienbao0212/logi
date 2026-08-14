import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, companyMemberships } from '../db/schema/system.js';
import { AppError } from '../lib/errors.js';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';

export async function loginService({ email, password }: any) {
  const JWT_SECRET = process.env.JWT_PRIVATE_KEY || 'default_secret';
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 400);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 400);
  }

  const memberships = await db.select().from(companyMemberships).where(eq(companyMemberships.userId, user.id));

  const payload = {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 mins
  };

  const token = await sign(payload, JWT_SECRET, 'HS256');

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    memberships,
    token,
  };
}
