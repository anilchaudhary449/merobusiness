import { dbConnect } from '../src/lib/mongoose';
import Website from '../src/models/Website';

async function checkDb() {
  await dbConnect();
  const sites = await Website.find({}).limit(1);
  console.log('--- DB RECORD START ---');
  console.log(JSON.stringify(sites[0], null, 2));
  console.log('--- DB RECORD END ---');
  process.exit(0);
}

checkDb();
