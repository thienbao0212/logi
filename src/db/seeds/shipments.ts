import { db } from '../index.js';
import { shipments, customers, locations, shipmentEvents } from '../schema/shipments.js';
import { companies, users } from '../schema/system.js';
import { eq } from 'drizzle-orm';

async function seedShipments() {
  console.log('Generating 20 sample shipments...');

  const [company] = await db.select().from(companies).limit(1);
  const [user] = await db.select().from(users).where(eq(users.email, 'logistic@logiflow.com')).limit(1);
  const [customer] = await db.select().from(customers).limit(1);
  const locs = await db.select().from(locations).limit(2);

  if (!company || !user || !customer || locs.length < 2) {
    console.error('Required base data not found. Run db:seed first.');
    process.exit(1);
  }

  const origin = locs[0];
  const dest = locs[1];

  const modes = ['SEA', 'AIR', 'LAND', 'RAIL'] as const;
  const statuses = ['DRAFT', 'PENDING', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const;

  const newShipments = [];

  for (let i = 0; i < 30; i++) {
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const trackingNumber = `TRK-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${i}`;

    const [shipment] = await db.insert(shipments).values({
      companyId: company.id,
      trackingNumber,
      customerId: customer.id,
      originId: origin.id,
      destinationId: dest.id,
      mode: randomMode,
      status: randomStatus,
      weightTotal: `${Math.floor(Math.random() * 5000) + 100} kg`,
      volumeTotal: `${Math.floor(Math.random() * 50) + 1} cbm`,
      createdBy: user.id,
    }).returning();

    // Create an event for it
    await db.insert(shipmentEvents).values({
      shipmentId: shipment.id,
      status: randomStatus,
      description: `Shipment updated to ${randomStatus}`,
      createdBy: user.id,
      locationId: origin.id,
    });

    newShipments.push(shipment);
  }

  console.log(`Successfully generated ${newShipments.length} sample shipments.`);
  process.exit(0);
}

seedShipments().catch((err) => {
  console.error('Failed to generate shipments:', err);
  process.exit(1);
});
