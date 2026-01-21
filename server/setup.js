const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://root:root@airbnb.fzehhma.mongodb.net/bus_tracking');
    console.log('✅ Connected to MongoDB');
    
    // Import models
    const User = require('./models/User');
    const Bus = require('./models/Bus');
    
    // Clear old data
    await User.deleteMany({});
    await Bus.deleteMany({});
    console.log('🧹 Cleared old data');
    
    // 1. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    console.log(`👑 Admin created: ${admin.email}`);
    
    // 2. Create Driver
    const driver = await User.create({
      name: 'John Driver',
      email: 'driver@college.edu',
      password: await bcrypt.hash('driver123', 10),
      role: 'driver',
      phone: '+1234567890'
    });
    console.log(`👨‍✈️ Driver created: ${driver.email}`);
    
    // 3. Create Bus and assign to driver
    const bus = await Bus.create({
      busId: 'BUS_01',
      busNumber: '01',
      routeName: 'Main Campus Route',
      driverName: driver.name,
      driverId: driver._id,
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'moving',
      capacity: 40
    });
    console.log(`🚌 Bus created: ${bus.busNumber}`);
    
    // 4. Create Student
    const student = await User.create({
      name: 'Test Student',
      email: 'student@college.edu',
      password: await bcrypt.hash('student123', 10),
      studentId: 'STU001',
      phone: '+9876543210',
      role: 'student',
      busAssigned: bus._id
    });
    console.log(`👨‍🎓 Student created: ${student.email}`);
    
    // Add student to bus
    bus.students.push(student._id);
    await bus.save();
    
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('ADMIN:');
    console.log('  Email: admin@college.edu');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('\nDRIVER:');
    console.log('  Email: driver@college.edu');
    console.log('  Password: driver123');
    console.log('  Role: driver');
    console.log('\nSTUDENT:');
    console.log('  Email: student@college.edu');
    console.log('  Password: student123');
    console.log('  Role: student');
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Run server: npm run dev');
    console.log('2. Open browser: http://localhost:3000');
    console.log('3. Use test accounts to login');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();