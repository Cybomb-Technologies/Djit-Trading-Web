// deleteUser.js
const mongoose = require('mongoose');
const User = require('./models/User'); // <-- corrected path

const MONGO_URI = 'mongodb://localhost:27017/course_platform';

const deleteAllUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} user(s)`);

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error deleting users:', err);
  }
};

deleteAllUsers();
