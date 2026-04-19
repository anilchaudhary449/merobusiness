const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const orders = await db.collection('orders').find({}).toArray();
    fs.writeFileSync('orders_dump.json', JSON.stringify(orders, null, 2));
    console.log('dumped to orders_dump.json');
    process.exit();
}).catch(e => console.error(e));
