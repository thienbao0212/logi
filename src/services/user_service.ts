import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, companyMemberships } from '../db/schema/system.js';
import { AppError } from '../lib/errors.js';
import bcrypt from 'bcryptjs';

export interface CreateUserInput {
  companyId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'logistic' | 'accountant' | 'viewer';
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'logistic' | 'accountant' | 'viewer';
}

export async function listCompanyUsers(companyId: string, search?: string) {
  const memberships = await db
    .select({
      membershipId: companyMemberships.id,
      companyId: companyMemberships.companyId,
      userId: companyMemberships.userId,
      role: companyMemberships.role,
      joinedAt: companyMemberships.createdAt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt,
      },
    })
    .from(companyMemberships)
    .innerJoin(users, eq(companyMemberships.userId, users.id))
    .where(and(eq(companyMemberships.companyId, companyId), isNull(users.deletedAt)))
    .orderBy(desc(companyMemberships.createdAt));

  if (!search) {
    return memberships;
  }

  const q = search.toLowerCase().trim();
  return memberships.filter(
    (m) =>
      m.user.email.toLowerCase().includes(q) ||
      m.user.firstName.toLowerCase().includes(q) ||
      m.user.lastName.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
  );
}

export async function createCompanyUser(input: CreateUserInput) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase().trim()))
    .limit(1);

  let userId: string;

  if (existingUser.length > 0) {
    const existing = existingUser[0];
    // Check if membership already exists in this company
    const existingMembership = await db
      .select()
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.companyId, input.companyId),
          eq(companyMemberships.userId, existing.id)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      throw new AppError('CONFLICT', 'User is already a member of this company', 409);
    }
    userId = existing.id;
  } else {
    // Create new user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const [newUser] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase().trim(),
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      })
      .returning();

    userId = newUser.id;
  }

  // Create membership
  const [membership] = await db
    .insert(companyMemberships)
    .values({
      companyId: input.companyId,
      userId,
      role: input.role,
    })
    .returning();

  const [createdUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return {
    membershipId: membership.id,
    companyId: membership.companyId,
    userId: membership.userId,
    role: membership.role,
    joinedAt: membership.createdAt,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      createdAt: createdUser.createdAt,
    },
  };
}

export async function updateCompanyUser(
  userId: string,
  companyId: string,
  input: UpdateUserInput
) {
  if (input.firstName !== undefined || input.lastName !== undefined) {
    await db
      .update(users)
      .set({
        ...(input.firstName !== undefined && { firstName: input.firstName.trim() }),
        ...(input.lastName !== undefined && { lastName: input.lastName.trim() }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  if (input.role !== undefined) {
    await db
      .update(companyMemberships)
      .set({
        role: input.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(companyMemberships.companyId, companyId),
          eq(companyMemberships.userId, userId)
        )
      );
  }

  const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [membership] = await db
    .select()
    .from(companyMemberships)
    .where(
      and(
        eq(companyMemberships.companyId, companyId),
        eq(companyMemberships.userId, userId)
      )
    )
    .limit(1);

  return {
    membershipId: membership?.id,
    companyId,
    userId,
    role: membership?.role,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      updatedAt: updatedUser.updatedAt,
    },
  };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new AppError('VALIDATION_ERROR', 'Mật khẩu phải có ít nhất 6 ký tự', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true, message: 'Password updated successfully' };
}

export async function removeCompanyUser(userId: string, companyId: string) {
  // Check if it's the last admin
  const adminCount = await db
    .select()
    .from(companyMemberships)
    .where(
      and(
        eq(companyMemberships.companyId, companyId),
        eq(companyMemberships.role, 'admin')
      )
    );

  const isCurrentAdmin = adminCount.some((m) => m.userId === userId);
  if (isCurrentAdmin && adminCount.length <= 1) {
    throw new AppError(
      'FORBIDDEN',
      'Không thể xóa quản trị viên duy nhất của công ty',
      400
    );
  }

  // Remove membership from this company
  await db
    .delete(companyMemberships)
    .where(
      and(
        eq(companyMemberships.companyId, companyId),
        eq(companyMemberships.userId, userId)
      )
    );

  return { success: true, message: 'Member removed from company' };
}

export { ROLE_PERMISSIONS_MATRIX } from '../ui/pages/settings/user_service.js';

