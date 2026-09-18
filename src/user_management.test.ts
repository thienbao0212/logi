import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill localStorage in node test environment
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
  get length() {
    return storage.size;
  },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import { UserService, ROLE_PERMISSIONS_MATRIX } from './ui/pages/settings/user_service.js';

describe('LogiFlow User & Role Management (RBAC)', () => {
  beforeEach(() => {
    // Reset UserService state to fresh seed
    localStorage.clear();
  });

  it('should initialize with default pre-seeded users', () => {
    const users = UserService.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);

    const roles = users.map((u) => u.role);
    expect(roles).toContain('admin');
    expect(roles).toContain('logistic');
    expect(roles).toContain('accountant');
    expect(roles).toContain('viewer');

    const admin = users.find((u) => u.role === 'admin');
    expect(admin?.email).toBe('admin@logiflow.com');
    expect(admin?.status).toBe('ACTIVE');
  });

  it('should create a new company user successfully', () => {
    const newUser = UserService.createUser({
      firstName: 'Thành',
      lastName: 'Lê',
      email: 'thanh.le@logiflow.com',
      phone: '0987654321',
      department: 'Phòng Vận Tải',
      role: 'logistic',
      password: 'password123',
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe('thanh.le@logiflow.com');
    expect(newUser.firstName).toBe('Thành');
    expect(newUser.lastName).toBe('Lê');
    expect(newUser.role).toBe('logistic');
    expect(newUser.status).toBe('ACTIVE');

    const all = UserService.getUsers();
    expect(all.some((u) => u.email === 'thanh.le@logiflow.com')).toBe(true);
  });

  it('should reject duplicate email when creating a user', () => {
    expect(() => {
      UserService.createUser({
        firstName: 'Trùng',
        lastName: 'Email',
        email: 'admin@logiflow.com', // Already exists
        phone: '0909090909',
        department: 'Ops',
        role: 'viewer',
        password: 'password123',
      });
    }).toThrow(/đã tồn tại/i);
  });

  it('should update user information correctly', () => {
    const users = UserService.getUsers();
    const target = users.find((u) => u.role === 'logistic')!;

    const updated = UserService.updateUser(target.id, {
      firstName: 'Nam Cường',
      phone: '0911223344',
      department: 'Điều phối Cát Lái',
    });

    expect(updated.firstName).toBe('Nam Cường');
    expect(updated.phone).toBe('0911223344');
    expect(updated.department).toBe('Điều phối Cát Lái');
  });

  it('should toggle user status between ACTIVE and INACTIVE', () => {
    const users = UserService.getUsers();
    const logisticUser = users.find((u) => u.role === 'logistic')!;

    const toggled = UserService.toggleStatus(logisticUser.id);
    expect(toggled.status).toBe('INACTIVE');

    const toggledBack = UserService.toggleStatus(logisticUser.id);
    expect(toggledBack.status).toBe('ACTIVE');
  });

  it('should prevent locking the last active admin', () => {
    const users = UserService.getUsers();
    const adminUser = users.find((u) => u.role === 'admin')!;

    expect(() => {
      UserService.toggleStatus(adminUser.id);
    }).toThrow(/Không thể khóa Quản trị viên/i);
  });

  it('should reset user password successfully with length validation', () => {
    const users = UserService.getUsers();
    const target = users[0];

    expect(() => {
      UserService.resetPassword(target.id, '123'); // Less than 6 chars
    }).toThrow(/ít nhất 6 ký tự/i);

    const success = UserService.resetPassword(target.id, 'SecurePass#2026');
    expect(success).toBe(true);
  });

  it('should delete a user and prevent deleting the last admin', () => {
    const users = UserService.getUsers();
    const adminUser = users.find((u) => u.role === 'admin')!;

    // Attempting to delete the only admin should throw
    expect(() => {
      UserService.deleteUser(adminUser.id);
    }).toThrow(/Không thể xóa Quản trị viên duy nhất/i);

    // Delete a non-admin user
    const logisticUser = users.find((u) => u.role === 'logistic')!;
    const deleted = UserService.deleteUser(logisticUser.id);
    expect(deleted).toBe(true);

    const remaining = UserService.getUsers();
    expect(remaining.some((u) => u.id === logisticUser.id)).toBe(false);
  });

  it('should validate the Role Permissions Matrix structure', () => {
    expect(ROLE_PERMISSIONS_MATRIX.length).toBe(5);

    const modules = ROLE_PERMISSIONS_MATRIX.map((m) => m.moduleKey);
    expect(modules).toContain('shipments');
    expect(modules).toContain('financial');
    expect(modules).toContain('accounting');
    expect(modules).toContain('master_data');
    expect(modules).toContain('system_settings');

    // Admin should have all permissions
    for (const group of ROLE_PERMISSIONS_MATRIX) {
      for (const perm of group.permissions) {
        expect(perm.admin).toBe(true);
      }
    }

    // Viewer should only have read-only permissions
    const shipmentGroup = ROLE_PERMISSIONS_MATRIX.find((m) => m.moduleKey === 'shipments')!;
    const editPerm = shipmentGroup.permissions.find((p) => p.name.includes('Sửa') || p.name.includes('Cập nhật'));
    expect(editPerm?.viewer).toBe(false);
  });
});
