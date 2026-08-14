import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://app:app@127.0.0.1:5437/logiflow_development';
const client = postgres(connectionString, { prepare: false });

async function main() {
  const newStatuses = [
    'BOOKED',
    'CARGO_RECEIVED',
    'DEPARTED_CHINA',
    'ARRIVED_CAT_LAI',
    'CUSTOMS_TRANSIT_DECLARED',
    'CUSTOMS_CLEARED',
    'DEPARTED_VIETNAM',
    'ARRIVED_CAMBODIA',
  ];

  for (const status of newStatuses) {
    try {
      await client.unsafe(`ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS '${status}'`);
      console.log(`Added ${status}`);
    } catch (e: any) {
      console.log(`Failed for ${status} - ${e.message}`);
    }
  }

  console.log('Done');
  await client.end();
}

main();
