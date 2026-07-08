'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // bcrypt hashes for 'Password123'
      const passHash = '$2b$12$Z0wNlyMek57qL589BqC9QOf1YmPq9Z.gC9271qK8GzBskp4M.3vW.';
      
      await queryInterface.bulkInsert('users', [
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          email: 'admin@troopp.in',
          phone: '+919999999999',
          password_hash: passHash,
          is_phone_verified: true,
          is_id_verified: true,
          is_face_verified: true,
          verification_status: 'verified',
          role: 'admin',
          trust_score: 100,
          reliability_score: 100,
          account_status: 'active',
          onboarding_completed: true,
          city_id: '33333333-3333-3333-3333-333333333333',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          email: 'raj@gmail.com',
          phone: '+919876543210',
          password_hash: passHash,
          is_phone_verified: true,
          is_id_verified: true,
          is_face_verified: false,
          verification_status: 'verified',
          role: 'member',
          trust_score: 80, // Trusted tier
          reliability_score: 95,
          account_status: 'active',
          onboarding_completed: true,
          city_id: '33333333-3333-3333-3333-333333333333',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          email: 'priya@gmail.com',
          phone: '+919876543211',
          password_hash: passHash,
          is_phone_verified: true,
          is_id_verified: true,
          is_face_verified: true,
          verification_status: 'verified',
          role: 'member',
          trust_score: 95, // Trusted tier
          reliability_score: 100,
          account_status: 'active',
          onboarding_completed: true,
          city_id: '33333333-3333-3333-3333-333333333333',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          email: 'amit@gmail.com',
          phone: '+919876543212',
          password_hash: passHash,
          is_phone_verified: true,
          is_id_verified: false,
          is_face_verified: false,
          verification_status: 'pending',
          role: 'member',
          trust_score: 50, // Verified (default threshold) or New depending on verification status
          reliability_score: 90,
          account_status: 'active',
          onboarding_completed: true,
          city_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          email: 'neha@gmail.com',
          phone: '+919876543213',
          password_hash: passHash,
          is_phone_verified: true,
          is_id_verified: false,
          is_face_verified: false,
          verification_status: 'pending',
          role: 'member',
          trust_score: 45, // New tier
          reliability_score: 80,
          account_status: 'active',
          onboarding_completed: true,
          city_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});

      // Insert profiles
      await queryInterface.bulkInsert('profiles', [
        { id: 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', user_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Super Admin', bio: 'Troopp Grievance Officer', gender: 'prefer_not_to_say', created_at: new Date(), updated_at: new Date() },
        { id: 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Raj Malhotra', bio: 'Avid trekker and photographer', gender: 'male', created_at: new Date(), updated_at: new Date() },
        { id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', user_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Priya Sharma', bio: 'Backpacker exploring India. Trek enthusiast.', gender: 'female', created_at: new Date(), updated_at: new Date() },
        { id: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', user_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Amit Verma', bio: 'Loves spontaneous road trips!', gender: 'male', created_at: new Date(), updated_at: new Date() },
        { id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', user_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', name: 'Neha Gupta', bio: 'Always down for heritage walks and filters.', gender: 'female', created_at: new Date(), updated_at: new Date() }
      ], {});

      // Insert emergency contacts
      await queryInterface.bulkInsert('emergency_contacts', [
        { id: 'ebbbbbbb-ebbb-ebbb-ebbb-ebbbbbbbbbbb', user_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Emergency Backup', phone: '+919000000000', relationship: 'Other', created_at: new Date(), updated_at: new Date() },
        { id: 'eccccccc-eccc-eccc-eccc-eccccccccccc', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Sohan Malhotra', phone: '+919000000001', relationship: 'Father', created_at: new Date(), updated_at: new Date() },
        { id: 'eddddddd-eddd-eddd-eddd-eddddddddddd', user_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Sunita Sharma', phone: '+919000000002', relationship: 'Mother', created_at: new Date(), updated_at: new Date() },
        { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', user_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Ramesh Verma', phone: '+919000000003', relationship: 'Brother', created_at: new Date(), updated_at: new Date() },
        { id: 'efffffff-efff-efff-efff-efffffffffff', user_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', name: 'Karan Gupta', phone: '+919000000004', relationship: 'Spouse', created_at: new Date(), updated_at: new Date() }
      ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('emergency_contacts', null, {});
      await queryInterface.bulkDelete('profiles', null, {});
      await queryInterface.bulkDelete('users', null, {});
  }
};
