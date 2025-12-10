const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('./User');

async function testUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    console.log('✓ User model loaded successfully');
    
    await mongoose.connection.close();
    console.log('✓ Test passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUser();