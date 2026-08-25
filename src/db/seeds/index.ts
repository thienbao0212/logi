import { db } from '../index.js';
import { users, companies, companyMemberships } from '../schema/system.js';
import { customers, locations } from '../schema/shipments.js';
import { shippingLines, ports } from '../schema/master_data.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Running seeds...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Get or create company
  let [company] = await db.select().from(companies).where(eq(companies.slug, 'logiflow-corp')).limit(1);
  if (!company) {
    [company] = await db.insert(companies).values({
      name: 'LogiFlow Corp',
      slug: 'logiflow-corp',
    }).returning();
    console.log(`Created company: ${company.name}`);
  } else {
    console.log(`Company already exists: ${company.name}`);
  }

  // 2. Create users if they don't exist
  let [adminUser] = await db.select().from(users).where(eq(users.email, 'admin@logiflow.com')).limit(1);
  if (!adminUser) {
    [adminUser] = await db.insert(users).values({
      email: 'admin@logiflow.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
    }).returning();
    console.log('Created admin user');
  }

  let [logisticUser] = await db.select().from(users).where(eq(users.email, 'logistic@logiflow.com')).limit(1);
  if (!logisticUser) {
    [logisticUser] = await db.insert(users).values({
      email: 'logistic@logiflow.com',
      passwordHash,
      firstName: 'Logistic',
      lastName: 'User',
    }).returning();
    console.log('Created logistic user');
  }

  // 3. Create memberships if not exist
  const existingMemberships = await db.select().from(companyMemberships).where(eq(companyMemberships.companyId, company.id));
  if (existingMemberships.length === 0) {
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
  }

  // 4. Create default customers if not exist
  const existingCustomers = await db.select().from(customers).where(eq(customers.companyId, company.id));
  if (existingCustomers.length === 0) {
    await db.insert(customers).values([
      {
        id: '00000000-0000-4000-8000-000000000001',
        companyId: company.id,
        name: 'Acme Logistics Corp',
        email: 'contact@acmecorp.com',
        phone: '+84 901 888 999',
        address: '123 Nguyen Hue, Ben Nghe, District 1, HCMC',
      },
      {
        companyId: company.id,
        name: 'Mekong Trading & Supply Chain',
        email: 'info@mekongtrading.vn',
        phone: '+84 912 345 678',
        address: '456 Le Duan, Da Nang City',
      },
      {
        companyId: company.id,
        name: 'Khmer Import Export Co., Ltd',
        email: 'support@khmerimport.com',
        phone: '+855 23 888 777',
        address: 'Monivong Blvd, Phnom Penh, Cambodia',
      },
    ]);
    console.log('Created default customers');
  }

  // 5. Create default locations if not exist
  const existingLocations = await db.select().from(locations).where(eq(locations.companyId, company.id));
  if (existingLocations.length === 0) {
    await db.insert(locations).values([
      {
        id: '00000000-0000-4000-8000-000000000002',
        companyId: company.id,
        name: 'Shanghai Port',
        address: 'Shanghai Harbor Area, China',
        type: 'PORT',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        companyId: company.id,
        name: 'Cat Lai Port, Vietnam',
        address: 'Cat Lai, Thu Duc City, HCMC, Vietnam',
        type: 'PORT',
      },
      {
        companyId: company.id,
        name: 'Phnom Penh Logistics Hub',
        address: 'National Road 4, Phnom Penh, Cambodia',
        type: 'WAREHOUSE',
      },
    ]);
    console.log('Created default locations');
  }

  // 6. Create default shipping lines if not exist
  const existingShippingLines = await db.select().from(shippingLines).where(eq(shippingLines.companyId, company.id));
  if (existingShippingLines.length === 0) {
    await db.insert(shippingLines).values([
      {
        companyId: company.id,
        code: 'MSK',
        name: 'Maersk Line',
        contactPerson: 'Mr. Soren Hansen',
        email: 'vietnam.sales@maersk.com',
        phone: '+84 28 3823 8888',
        website: 'https://www.maersk.com',
        trackingUrl: 'https://www.maersk.com/tracking',
        notes: 'Hãng tàu Đan Mạch hàng đầu thế giới, chuyên tuyến Á - Âu, Mỹ',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'COSCO',
        name: 'COSCO Shipping Lines',
        contactPerson: 'Ms. Li Wei',
        email: 'sales.hcmc@coscon.com',
        phone: '+84 28 3829 7920',
        website: 'https://lines.coscoshipping.com',
        trackingUrl: 'https://lines.coscoshipping.com/home/services/cargoTracking',
        notes: 'Chuyên tuyến nội Á, Trung Quốc - Đông Nam Á - Campuchia',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'EMC',
        name: 'Evergreen Marine Corp',
        contactPerson: 'Mr. David Chen',
        email: 'service@evergreen-marine.com.vn',
        phone: '+84 28 3910 1888',
        website: 'https://www.evergreen-marine.com',
        trackingUrl: 'https://www.shipmentlink.com/servlet/TTrk_Tracking',
        notes: 'Thế mạnh tuyến Intra-Asia và Bắc Mỹ',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'ONE',
        name: 'Ocean Network Express',
        contactPerson: 'Mr. Kenji Tanaka',
        email: 'vn.sales@one-line.com',
        phone: '+84 28 4458 2600',
        website: 'https://www.one-line.com',
        trackingUrl: 'https://www.one-line.com/en/standard-page/cargo-tracking',
        notes: 'Liên minh hãng tàu Nhật Bản (NYK, MOL, K-Line)',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'CMA',
        name: 'CMA CGM Group',
        contactPerson: 'Ms. Claire Dupont',
        email: 'ho.sales@cma-cgm.com',
        phone: '+84 28 3914 8400',
        website: 'https://www.cma-cgm.com',
        trackingUrl: 'https://www.cma-cgm.com/ebusiness/tracking',
        notes: 'Hãng tàu Pháp, mạng lưới toàn cầu',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'SITC',
        name: 'SITC Container Lines',
        contactPerson: 'Mr. Wang Hong',
        email: 'sitc_hcm@sitc.com',
        phone: '+84 28 3910 6363',
        website: 'https://www.sitc.com',
        trackingUrl: 'https://www.sitc.com/tracking',
        notes: 'Rất mạnh tuyến trực tiếp Trung Quốc - Cát Lái - Sihanoukville',
        isActive: true,
      }
    ]);
    console.log('Created default shipping lines');
  }

  // 7. Create default ports if not exist
  const existingPorts = await db.select().from(ports).where(eq(ports.companyId, company.id));
  if (existingPorts.length === 0) {
    await db.insert(ports).values([
      {
        companyId: company.id,
        code: 'VNSGN',
        name: 'Cảng Cát Lái (Cat Lai Port)',
        country: 'Việt Nam',
        countryCode: 'VN',
        city: 'TP. Hồ Chí Minh',
        type: 'SEAPORT',
        address: 'Phường Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh',
        notes: 'Cảng container bận rộn nhất Việt Nam, trung tâm tiếp nhận và chuyển tiếp hàng hóa',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'VNCMT',
        name: 'Cảng Quốc tế Cái Mép (CMIT)',
        country: 'Việt Nam',
        countryCode: 'VN',
        city: 'Bà Rịa - Vũng Tàu',
        type: 'SEAPORT',
        address: 'Thị xã Phú Mỹ, Tỉnh Bà Rịa - Vũng Tàu',
        notes: 'Cụm cảng nước sâu trung chuyển trực tiếp đi tuyến Châu Âu và Bắc Mỹ',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'VNHPH',
        name: 'Cảng Hải Phòng (Hai Phong Port)',
        country: 'Việt Nam',
        countryCode: 'VN',
        city: 'Hải Phòng',
        type: 'SEAPORT',
        address: 'Quận Ngô Quyền, TP. Hải Phòng',
        notes: 'Cảng cửa ngõ xuất nhập khẩu hàng hải trọng điểm khu vực miền Bắc',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'VNICD',
        name: 'ICD Phước Long (Phuoc Long ICD)',
        country: 'Việt Nam',
        countryCode: 'VN',
        city: 'TP. Hồ Chí Minh',
        type: 'ICD',
        address: 'Phường Phước Long A, TP. Thủ Đức, TP. Hồ Chí Minh',
        notes: 'Cảng cạn làm thủ tục hải quan và thông quan hàng hóa nhanh',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'VNMBA',
        name: 'Cửa khẩu Quốc tế Mộc Bài',
        country: 'Việt Nam',
        countryCode: 'VN',
        city: 'Tây Ninh',
        type: 'BORDER_GATE',
        address: 'Huyện Bến Cầu, Tỉnh Tây Ninh',
        notes: 'Cửa khẩu đường bộ huyết mạch thông quan xe tải tuyến Việt Nam - Campuchia (Bavet)',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'CNSHA',
        name: 'Cảng Thượng Hải (Port of Shanghai)',
        country: 'Trung Quốc',
        countryCode: 'CN',
        city: 'Shanghai',
        type: 'SEAPORT',
        address: 'Shanghai Harbor Area, Shanghai, China',
        notes: 'Cảng container lớn nhất thế giới, nguồn hàng xuất khẩu trọng điểm',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'CNSZX',
        name: 'Cảng Thâm Quyến (Port of Shenzhen)',
        country: 'Trung Quốc',
        countryCode: 'CN',
        city: 'Shenzhen',
        type: 'SEAPORT',
        address: 'Yantian / Shekou, Shenzhen, Guangdong, China',
        notes: 'Cụm cảng xuất khẩu thiết bị điện tử và tiêu dùng miền Nam Trung Quốc',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'KHPNH',
        name: 'Cảng Tự trị Phnom Penh (PPAP)',
        country: 'Campuchia',
        countryCode: 'KH',
        city: 'Phnom Penh',
        type: 'INLAND_PORT',
        address: 'Prek Pnov Terminal, Phnom Penh, Cambodia',
        notes: 'Cảng sông quốc tế tiếp nhận sà lan hàng hóa trung chuyển từ Cát Lái',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'KHKOS',
        name: 'Cảng Quốc tế Sihanoukville (PAS)',
        country: 'Campuchia',
        countryCode: 'KH',
        city: 'Sihanoukville',
        type: 'SEAPORT',
        address: 'Terak Vithei Samdech Akka Moha Sena Padei Techo Hun Sen, Sihanoukville',
        notes: 'Cảng nước sâu quốc tế duy nhất của Vương quốc Campuchia',
        isActive: true,
      },
      {
        companyId: company.id,
        code: 'VNSGN-AIR',
        name: 'Ga Hàng hóa Sân bay Tân Sơn Nhất',
        country: 'Việt Nam',
        countryCode: 'VN',
        city: 'TP. Hồ Chí Minh',
        type: 'AIRPORT',
        address: 'TCS Cargo Terminal, Quận Tân Bình, TP. Hồ Chí Minh',
        notes: 'Trung tâm hàng hóa hàng không khu vực phía Nam',
        isActive: true,
      }
    ]);
    console.log('Created default ports');
  }

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
