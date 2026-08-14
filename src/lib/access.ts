import { AppContext } from './context/types.js';
import { AppError } from './errors.js';

export type AccessClaim = {
  company?: { id: string; rights?: string[] };
  globalRole?: string;
};

export function requireAccess(ctx: AppContext, claim: AccessClaim) {
  if (!ctx.user) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  if (claim.globalRole) {
    // For now we just check if any membership has the admin role, or we could have a global admin flag
    const isAdmin = ctx.memberships?.some(m => m.role === 'admin');
    if (!isAdmin && claim.globalRole === 'admin') {
      throw new AppError('FORBIDDEN', 'Admin access required', 403);
    }
  }

  if (claim.company) {
    const membership = ctx.memberships?.find(m => m.companyId === claim.company!.id);
    if (!membership) {
      // 404 to avoid oracle
      throw new AppError('NOT_FOUND', 'Company not found', 404);
    }
    
    // Check specific rights if we have fine-grained permissions. 
    // In our case, roles give rights.
    if (claim.company.rights) {
      // Example basic check
      if (membership.role !== 'admin' && claim.company.rights.includes('admin:*')) {
        throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
      }
    }
  }
}
