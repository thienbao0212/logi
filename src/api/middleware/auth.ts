import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, companyMemberships } from '../../db/schema/system.js';
import { AppContext } from '../../lib/context/types.js';

export async function requireAuth(c: Context, next: Next) {
  const JWT_SECRET = process.env.JWT_PRIVATE_KEY || 'default_secret';
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Missing token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    
    // In a real app we might cache this or avoid a DB hit on every request
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub as string)).limit(1);
    if (!user) {
      return c.json({ error: 'UNAUTHORIZED', message: 'User not found' }, 401);
    }
    
    const memberships = await db.select().from(companyMemberships).where(eq(companyMemberships.userId, user.id));

    const ctx: AppContext = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      memberships,
      db,
    };

    c.set('ctx', ctx);
    await next();
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return c.json({ error: 'UNAUTHORIZED', message: 'Invalid token' }, 401);
  }
}
