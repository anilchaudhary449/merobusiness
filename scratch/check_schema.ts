import { dbConnect } from '../src/lib/mongoose';
import Website from '../src/models/Website';

async function checkSchema() {
  await dbConnect();
  console.log('--- SCHEMA PATHS START ---');
  console.log(Object.keys(Website.schema.paths).filter(p => p.includes('BgColor') || p.includes('Color') || p.includes('Weight')));
  console.log('--- SCHEMA PATHS END ---');
  process.exit(0);
}

checkSchema();
