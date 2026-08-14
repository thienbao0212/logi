import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import authApp from './api/app/auth/index.js'
import shipmentsApp from './api/app/shipments/index.js'
import { requireAuth } from './api/middleware/auth.js'
import { AppContext } from './lib/context/types.js'

const app = new Hono<{ Variables: { ctx: AppContext } }>()

app.get('/api/system/health', (c) => c.json({ status: 'ok' }))

app.route('/api/auth', authApp)
app.route('/api/shipments', shipmentsApp)

app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  return c.json({ error: 'INTERNAL_SERVER_ERROR', message: err.message }, 500);
});

// Example protected route
app.get('/api/me', requireAuth, (c) => {
  const ctx = c.get('ctx')
  return c.json({ data: { user: ctx.user, memberships: ctx.memberships } })
})

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
})

console.log(`Server listening on port ${process.env.PORT || 3000}`)
