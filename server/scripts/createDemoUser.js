const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function createDemoUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    const existingUser = await User.findOne({ email: 'alice@example.com' });
    if (existingUser) {
      console.log('User already exists:', existingUser.username);
      process.exit(0);
    }

    // Create new user
    const user = await User.create({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123'
    });

    console.log('Demo user created:');
    console.log('- Username: alice');
    console.log('- Email: alice@example.com');
    console.log('- Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDemoUser();
