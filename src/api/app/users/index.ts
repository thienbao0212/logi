import { Hono } from 'hono';
import { z } from 'zod';
import { AppContext } from '../../../lib/context/types.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  listCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  resetUserPassword,
  removeCompanyUser,
  ROLE_PERMISSIONS_MATRIX,
} from '../../../services/user_service.js';

const usersApp = new Hono<{ Variables: { ctx: AppContext } }>();

// ─── Input Validation Schemas ─────────────────────────────────────────────────
const createUserSchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
  role: z.enum(['admin', 'logistic', 'accountant', 'viewer']),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['admin', 'logistic', 'accountant', 'viewer']).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
});

// Require authenticated user for all endpoints
usersApp.use('*', requireAuth);

// Helper to check admin permission
function checkAdminAccess(c: any, companyId: string) {
  const ctx = c.get('ctx') as AppContext;
  const membership = ctx.memberships?.find((m) => m.companyId === companyId);
  if (!membership || membership.role !== 'admin') {
    return false;
  }
  return true;
}

// 1. GET /api/users - List users in company
usersApp.get('/', async (c) => {
  const companyId = c.req.query('companyId');
  const search = c.req.query('search');

  if (!companyId) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'companyId is required' }, 400);
  }

  const usersList = await listCompanyUsers(companyId, search);
  return c.json({ data: usersList });
});

// 2. GET /api/users/roles-matrix - Get RBAC permissions matrix
usersApp.get('/roles-matrix', (c) => {
  return c.json({ data: ROLE_PERMISSIONS_MATRIX });
});

// 3. POST /api/users - Create new company user
usersApp.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createUserSchema.parse(body);

    if (!checkAdminAccess(c, parsed.companyId)) {
      return c.json({ error: 'FORBIDDEN', message: 'Chỉ Quản trị viên mới có quyền tạo thành viên' }, 403);
    }

    const created = await createCompanyUser(parsed);
    return c.json({ data: created }, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return c.json({ error: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400);
    }
    return c.json({ error: err.code || 'ERROR', message: err.message }, err.status || 500);
  }
});

// 4. PUT /api/users/:id - Update user details & role
usersApp.put('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const companyId = c.req.query('companyId');

    if (!companyId) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'companyId is required' }, 400);
    }

    if (!checkAdminAccess(c, companyId)) {
      return c.json({ error: 'FORBIDDEN', message: 'Chỉ Quản trị viên mới có quyền cập nhật thành viên' }, 403);
    }

    const body = await c.req.json();
    const parsed = updateUserSchema.parse(body);

    const updated = await updateCompanyUser(userId, companyId, parsed);
    return c.json({ data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return c.json({ error: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400);
    }
    return c.json({ error: err.code || 'ERROR', message: err.message }, err.status || 500);
  }
});

// 5. PUT /api/users/:id/password - Reset user password
usersApp.put('/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const companyId = c.req.query('companyId');

    if (!companyId || !checkAdminAccess(c, companyId)) {
      return c.json({ error: 'FORBIDDEN', message: 'Chỉ Quản trị viên mới có quyền đổi mật khẩu thành viên' }, 403);
    }

    const body = await c.req.json();
    const parsed = resetPasswordSchema.parse(body);

    const result = await resetUserPassword(userId, parsed.newPassword);
    return c.json({ data: result });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return c.json({ error: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400);
    }
    return c.json({ error: err.code || 'ERROR', message: err.message }, err.status || 500);
  }
});

// 6. DELETE /api/users/:id - Remove user from company
usersApp.delete('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const companyId = c.req.query('companyId');

    if (!companyId || !checkAdminAccess(c, companyId)) {
      return c.json({ error: 'FORBIDDEN', message: 'Chỉ Quản trị viên mới có quyền xóa thành viên' }, 403);
    }

    const result = await removeCompanyUser(userId, companyId);
    return c.json({ data: result });
  } catch (err: any) {
    return c.json({ error: err.code || 'ERROR', message: err.message }, err.status || 500);
  }
});

export default usersApp;
