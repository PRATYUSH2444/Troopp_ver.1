'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('activities', [
        {
          id: '12121212-1212-1212-1212-121212121212',
          creator_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // Raj
          title: 'Night Trek to Kalsubai Peak',
          type: 'trek',
          description: 'Join us for an exciting night trek to the highest peak in Maharashtra. Breath-taking views and stars!',
          date_time: new Date(Date.now() + 86400000 * 2), // 2 days in future
          meeting_point_lat: 19.6175,
          meeting_point_lng: 73.7845,
          meeting_point_label: 'Bari Village Base camp, Kalsubai',
          destination: 'Kalsubai Peak Summit',
          city_id: '33333333-3333-3333-3333-333333333333', // Bangalore (test city mapping)
          max_group_size: 10,
          current_members: 2,
          cost_per_person: 600.00,
          difficulty_level: 'hard',
          packing_checklist: JSON.stringify([{ item: 'Headlamp', qty: '1', checked: false }, { item: 'Water', qty: '2L', checked: false }]),
          visibility: 'open',
          is_women_only: false,
          min_trust_score: 50,
          min_reliability_score: 70,
          vibe_score_tag: '🏔️ Hardcore Adventurer',
          status: 'open',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '34343434-3434-3434-3434-343434343434',
          creator_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Priya
          title: 'Nandi Hills Sunrise Drive',
          type: 'night_drive',
          description: 'Spontaneous night owls sunrise meetup and coffee run to Nandi hills. Free spirit drive.',
          date_time: new Date(Date.now() + 86400000 * 1), // 1 day in future
          meeting_point_lat: 13.3702,
          meeting_point_lng: 77.6835,
          meeting_point_label: 'Hebbal Flyover petrol pump',
          destination: 'Nandi Hills View Point',
          city_id: '33333333-3333-3333-3333-333333333333', // Bangalore
          max_group_size: 4,
          current_members: 1,
          cost_per_person: 200.00,
          difficulty_level: 'easy',
          packing_checklist: JSON.stringify([{ item: 'Driving License', qty: '1', checked: false }]),
          visibility: 'open',
          is_women_only: false,
          min_trust_score: 0,
          min_reliability_score: 50,
          vibe_score_tag: '🌙 Spontaneous Night Owl',
          status: 'open',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});

      // Insert trip rooms for these activities
      await queryInterface.bulkInsert('trip_rooms', [
        {
          id: 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7',
          activity_id: '12121212-1212-1212-1212-121212121212',
          status: 'active',
          chat_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'a8a8a8a8-a8a8-a8a8-a8a8-a8a8a8a8a8a8',
          activity_id: '34343434-3434-3434-3434-343434343434',
          status: 'active',
          chat_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});

      // Set members
      await queryInterface.bulkInsert('activity_members', [
        // Raj is creator, but let's confirm members
        { id: 'e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e1', activity_id: '12121212-1212-1212-1212-121212121212', user_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', joined_at: new Date(), created_at: new Date(), updated_at: new Date() },
        { id: 'e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e2', activity_id: '12121212-1212-1212-1212-121212121212', user_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', joined_at: new Date(), created_at: new Date(), updated_at: new Date() },
        
        // Priya is creator of sunrise drive
        { id: 'e8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e1', activity_id: '34343434-3434-3434-3434-343434343434', user_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', joined_at: new Date(), created_at: new Date(), updated_at: new Date() }
      ], {});

      // Insert welcoming rules and messages
      await queryInterface.bulkInsert('trip_rules', [
        { id: 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', activity_id: '12121212-1212-1212-1212-121212121212', language: 'both', members_can_add_expenses: true, members_can_create_polls: true, chat_before_full: true, moderated_mode: false, phone_sharing_enabled: true, checkin_required: true, safety_briefing_text: 'Stay with the group. Carry a torch. Base camp is Bari Village.', created_at: new Date(), updated_at: new Date() },
        { id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', activity_id: '34343434-3434-3434-3434-343434343434', language: 'english', members_can_add_expenses: false, members_can_create_polls: true, chat_before_full: true, moderated_mode: false, phone_sharing_enabled: true, checkin_required: false, safety_briefing_text: 'Drive safely, avoid over-speeding.', created_at: new Date(), updated_at: new Date() }
      ], {});

      await queryInterface.bulkInsert('trip_welcome_messages', [
        { id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', activity_id: '12121212-1212-1212-1212-121212121212', message_text: 'Welcome to Kalsubai trek squad! Introduce yourselves.', created_at: new Date(), updated_at: new Date() },
        { id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', activity_id: '34343434-3434-3434-3434-343434343434', message_text: 'Welcome sunrise group! Let us align on carpool details.', created_at: new Date(), updated_at: new Date() }
      ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('trip_welcome_messages', null, {});
      await queryInterface.bulkDelete('trip_rules', null, {});
      await queryInterface.bulkDelete('activity_members', null, {});
      await queryInterface.bulkDelete('trip_rooms', null, {});
      await queryInterface.bulkDelete('activities', null, {});
  }
};
