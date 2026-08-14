import { db } from '../index.js';
import { users, companies, companyMemberships } from '../schema/system.js';
import { customers, locations } from '../schema/shipments.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Running seeds...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create a company
  const [company] = await db.insert(companies).values({
    name: 'LogiFlow Corp',
    slug: 'logiflow-corp',
  }).returning();
  console.log(`Created company: ${company.name}`);

  // 2. Create users
  const [adminUser] = await db.insert(users).values({
    email: 'admin@logiflow.com',
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
  }).returning();

  const [logisticUser] = await db.insert(users).values({
    email: 'logistic@logiflow.com',
    passwordHash,
    firstName: 'Logistic',
    lastName: 'User',
  }).returning();
  console.log('Created users');

  // 3. Create memberships
  await db.insert(companyMemberships).values([
    {
      companyId: company.id,
      userId: adminUser.id,
      role: 'admin',
    },
    {
      companyId: company.id,
      userId: logisticUser.id,
      role: 'logistic',
    }
  ]);
  console.log('Created memberships');

  // 4. Create default customer and locations for demo
  await db.insert(customers).values({
    id: '00000000-0000-4000-8000-000000000001',
    companyId: company.id,
    name: 'Acme Corp',
  });
  await db.insert(locations).values([
    {
      id: '00000000-0000-4000-8000-000000000002',
      companyId: company.id,
      name: 'Shanghai Port',
      address: 'Port Area',
      type: 'PORT',
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      companyId: company.id,
      name: 'Los Angeles Warehouse',
      address: 'LA Harbor',
      type: 'WAREHOUSE',
    }
  ]);
  console.log('Created default customer and locations');

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
