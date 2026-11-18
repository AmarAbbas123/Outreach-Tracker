/**
 * Dev utility: Reset or create a user's password directly in MongoDB.
 * Usage: node --env-file=./server/.env server/src/scripts/resetPassword.js <email> <newPassword>
 *
 * Example:
 *   node --env-file=./server/.env server/src/scripts/resetPassword.js admin@test.com MyPass123
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Usage: node resetPassword.js <email> <newPassword>');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const usersCollection = mongoose.connection.db.collection('users');

  // List all users first
  const allUsers = await usersCollection.find({}, { projection: { email: 1, name: 1 } }).toArray();
  console.log('\n📋 All users in database:');
  if (allUsers.length === 0) {
    console.log('  (no users found)');
  } else {
    allUsers.forEach((u) => console.log(`  - ${u.email}  (${u.name || 'no name'})`));
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await usersCollection.updateOne(
    { email: email.toLowerCase().trim() },
    { $set: { passwordHash } }
  );

  if (result.matchedCount === 0) {
    console.log(`\n⚠️  No user found with email: ${email}`);
    console.log('   Creating new user instead...');

    // Create a new workspace
    const workspacesCollection = mongoose.connection.db.collection('workspaces');
    const ws = await workspacesCollection.insertOne({
      name: `${email.split('@')[0]}'s Workspace`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await usersCollection.insertOne({
      name: email.split('@')[0],
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'owner',
      workspace: ws.insertedId,
      timezone: 'UTC',
      signature: '',
      followUpDays: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ New user created: ${email}`);
  } else {
    console.log(`\n✅ Password reset successfully for: ${email}`);
  }

  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${newPassword}`);
  console.log('\n🚀 You can now log in with these credentials.\n');

  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
