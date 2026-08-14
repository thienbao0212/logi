import { Hono } from 'hono';
import { z } from 'zod';
import { loginService } from '../../../services/auth.js';
import { setCookie, deleteCookie } from 'hono/cookie';

const authApp = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authApp.post('/login', async (c) => {
  const body = loginSchema.parse(await c.req.json());
  
  try {
    const { user, memberships, token } = await loginService(body);
    
    // In a real app we might set a refresh token as HttpOnly cookie
    setCookie(c, 'refresh_token', token, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return c.json({ data: { user, memberships, token } });
  } catch (err: any) {
    if (err.status) {
      return c.json({ error: err.code, message: err.message }, err.status);
    }
    throw err;
  }
});

authApp.post('/logout', (c) => {
  deleteCookie(c, 'refresh_token');
  return c.json({ data: { success: true } });
});

export default authApp;
