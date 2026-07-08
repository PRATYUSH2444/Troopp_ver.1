'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('cities', [
        { id: '11111111-1111-1111-1111-111111111111', city_name: 'Mumbai', state: 'Maharashtra', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '22222222-2222-2222-2222-222222222222', city_name: 'Delhi', state: 'Delhi', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '33333333-3333-3333-3333-333333333333', city_name: 'Bangalore', state: 'Karnataka', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '44444444-4444-4444-4444-444444444444', city_name: 'Hyderabad', state: 'Telangana', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '55555555-5555-5555-5555-555555555555', city_name: 'Ahmedabad', state: 'Gujarat', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '66666666-6666-6666-6666-666666666666', city_name: 'Pune', state: 'Maharashtra', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '77777777-7777-7777-7777-777777777777', city_name: 'Chennai', state: 'Tamil Nadu', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '88888888-8888-8888-8888-888888888888', city_name: 'Kolkata', state: 'West Bengal', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: '99999999-9999-9999-9999-999999999999', city_name: 'Jaipur', state: 'Rajasthan', is_active: true, created_at: new Date(), updated_at: new Date() },
        { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', city_name: 'Surat', state: 'Gujarat', is_active: true, created_at: new Date(), updated_at: new Date() }
      ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('cities', null, {});
  }
};
