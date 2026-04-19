import { dbConnect } from './src/lib/mongoose';
import User from './src/models/User';
import Website from './src/models/Website';
import Order from './src/models/Order';

async function debugData() {
  try {
    await dbConnect();
    
    const userCount = await User.countDocuments();
    const customerCount = await User.countDocuments({ role: 'CUSTOMER' });
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    const websiteCount = await Website.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log('--- DB Stats ---');
    console.log('Total Users:', userCount);
    console.log('Customers:', customerCount);
    console.log('Admins:', adminCount);
    console.log('Websites:', websiteCount);
    console.log('Orders:', orderCount);
    
    if (adminCount > 0) {
      const admins = await User.find({ role: 'ADMIN' }, 'email assignedSiteIds').lean();
      console.log('\n--- Admins ---');
      admins.forEach((a: any) => {
        console.log(`Email: ${a.email}, Assigned Sites: ${JSON.stringify(a.assignedSiteIds)}`);
      });
    }

    if (orderCount > 0) {
        const sampleOrder = await Order.findOne().lean();
        console.log('\n--- Sample Order ---');
        console.log(JSON.stringify(sampleOrder, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Debug script error:', error);
    process.exit(1);
  }
}

debugData();
