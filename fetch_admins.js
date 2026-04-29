const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://merobusiness:merobusiness123@cluster0.rlg1qww.mongodb.net/merobusiness?retryWrites=true&w=majority').then(async () => {
  const db = mongoose.connection.useDb('merobusiness');
  const users = await db.collection('users').find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).toArray();
  console.log('Admins:', users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
});
